const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

// Auth: 10 attempts per 15 minutes (account lockout handles brute force beyond this)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 10,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// General API: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// LLM: 20 requests per hour (cost control)
const llmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? 10000 : 20,
  message: { error: 'LLM generation limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Datacard operations: 50 per 15 minutes
const datacardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 50,
  message: { error: 'Too many datacard operations, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, authLimiter, llmLimiter, datacardLimiter };
