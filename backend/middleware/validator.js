const { body, param, validationResult } = require('express-validator');

/**
 * Handles validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validates the rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/).withMessage(
      'Password must contain uppercase, lowercase, a number, and a special character'
    ),

  handleValidationErrors
];

/**
 * Validates the rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors
];

/**
 * Validates the rules for datacard creation/update
 */
const datacardValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('fields')
    .optional()
    .isArray({ max: 20 }).withMessage('Maximum 20 fields allowed'),

  body('fields.*.label')
    .optional()
    .trim()
    .notEmpty().withMessage('Field label is required')
    .isLength({ max: 50 }).withMessage('Field label cannot exceed 50 characters'),

  body('fields.*.value')
    .optional()
    .isLength({ max: 1000 }).withMessage('Field value cannot exceed 1000 characters'),

  body('fields.*.type')
    .optional()
    .isIn(['text', 'email', 'phone', 'date', 'url', 'image', 'textarea'])
    .withMessage('Invalid field type'),

  body('template')
    .optional()
    .isIn(['default', 'professional', 'minimal', 'creative'])
    .withMessage('Invalid template'),

  body('visibility')
    .optional()
    .isIn(['private', 'public'])
    .withMessage('Visibility must be private or public'),

  handleValidationErrors
];

/**
 * Validates for MongoDB ObjectId
 */
const objectIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),

  handleValidationErrors
];

/**
 * Validates the rules for profile update
 */
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Validates for LLM generation prompt
 */
const llmPromptValidation = [
  body('prompt')
    .trim()
    .notEmpty().withMessage('Prompt is required')
    .isLength({ min: 10, max: 500 }).withMessage('Prompt must be 10-500 characters'),

  // Optional RAG reference document — plain text only, no HTML/scripts
  body('referenceText')
    .optional()
    .isString().withMessage('Reference text must be a string')
    .isLength({ max: 10000 }).withMessage('Reference text cannot exceed 10,000 characters')
    .customSanitizer(val => val.replace(/<[^>]*>/g, '').trim()), // strip any HTML tags

  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  updateUserValidation,
  datacardValidation,
  objectIdValidation,
  llmPromptValidation,
  handleValidationErrors
};
