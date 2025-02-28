import { body, query, param } from 'express-validator';

export const hasUserIdValidationRules = () => [query('userId').notEmpty().withMessage('User ID is required')];

export const createShortURLValidationRules = () => [
  body('originalUrl')
    .notEmpty()
    .withMessage('Original URL is required')
    .isURL()
    .withMessage('Original URL must be a valid URL'),
  body('userId').optional(),
];

export const deleteAllUserURLsValidationRules = () => [
  body('userId').notEmpty().withMessage('User ID is required'),
];

export const urlIdParamValidationRules = () => [
  param('id').isInt().withMessage('URL ID must be an integer').toInt(),
];

export const shortCodeParamValidationRules = () => [
  param('shortCode').notEmpty().withMessage('Short URL code is required'),
];
