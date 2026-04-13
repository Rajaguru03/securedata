// const reovkeLink = require('express-rate-limit');

// /**
//  * General API rate limiter
//  * 100 requests per 15 minutes
//  */
// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: {
//     error: 'Too many requests from this IP, please try again after 15 minutes'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });

// /**
//  * Auth rate limiter (stricter)
//  * 5 login/register attempts per 15 minutes
//  */
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5,
//   message: {
//     error: 'Too many authentication attempts, please try again after 15 minutes'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });

// /**
//  * LLM API rate limiter (most strict due to cost)
//  * 10 requests per hour
//  */
// const llmLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 10,
//   message: {
//     error: 'LLM generation limit reached. Please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });

// /**
//  * Datacard operations limiter
//  * 50 requests per 15 minutes
//  */
// const datacardLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 50,
//   message: {
//     error: 'Too many datacard operations, please try again later'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });

// module.exports = {
//   generalLimiter,
//   authLimiter,
//   llmLimiter,
//   datacardLimiter
// };
