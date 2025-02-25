import { body } from 'express-validator';

export const signInValidationRules = () => [
  body('name').notEmpty().withMessage('Name is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const signUpValidationRules = () => [
  body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('passwordConfirm').custom((value, { req }) => {
    if (req.body.confirmPassword !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

export const hasUserIdValidationRules = () => [body('userId').notEmpty().withMessage('User ID is required')];
