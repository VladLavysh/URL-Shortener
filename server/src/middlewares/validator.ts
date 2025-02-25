import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const firstError = errors.array()[0] as any; // no 'path' in ValidationError or AlternativeValidationError
  const extractedError = { [firstError.path]: firstError.msg };

  return res.status(422).json({
    errors: [extractedError],
  });
};
