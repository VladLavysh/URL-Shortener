import { body, query } from 'express-validator';

export const hasUserIdValidationRules = () => [
  query('userId').notEmpty().withMessage('User ID is required'),
];

export const createShortURLValidationRules = () => [
  body('url').isURL().withMessage('URL must be a valid URL'),
  body('userId').notEmpty().withMessage('User ID is required'),
];

export const deleteAllUserURLsValidationRules = () => [
  body('userId').notEmpty().withMessage('User ID is required'),
];
