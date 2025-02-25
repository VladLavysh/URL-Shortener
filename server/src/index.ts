import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { swaggerOptions, corsOptions } from './utils/variables';
import 'express-async-errors';

import { generalLimiter, authLimiter } from './utils/rateLimiters';
import authRouter from './routes/auth';
import urlRouter from './routes/url';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
});

const app = express();
const PORT = process.env.PORT || 3100;
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ ...corsOptions, origin: process.env.CLIENT_HOST }));

// Rate Limiting
app.use('/url', generalLimiter);
app.use('/auth', authLimiter);

// Routes
app.use('/auth', authRouter);
app.use('/url', urlRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} - ${process.env.NODE_ENV}`);
    });
  } catch (e) {
    console.log(e);
  }
};

startServer();
