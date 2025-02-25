import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { swaggerOptions } from './utils/variables';
import 'express-async-errors';

import { generalLimiter, authLimiter } from './utils/rateLimiters';
import authRouter from './routes/auth';
import urlRouter from './routes/url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3300;
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? 'https://production-domain.com' // TODO: replace with a prod domain
      : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors(corsOptions));

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
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
};

startServer();
