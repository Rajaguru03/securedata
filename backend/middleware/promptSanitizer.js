const { sanitizePrompt } = require('../utils/llmService');
const { logSecurityEvent } = require('./auditLogger');

/**
 * Middleware strip prompt injection patterns from req.body.prompt before the
 * requesting to reache the controller. Runs AFTER llmPromptValidation (so prompt is
 * guaranteed to be a non-empty string within length limits).
 *
 * - Mutates the req.body.prompt in place with the sanitized value.
 * - Attaches req.injectionCount so downstream code can inspect it if needed.
 * - Logs a SECURITY event when injection patterns are found.
 * - Never blocks the requests malicious patterns are stripped, not rejected.
 */
const promptSanitizer = (req, res, next) => {
  const raw = req.body?.prompt;

  if (typeof raw !== 'string') {
    req.injectionCount = 0;
    return next();
  }

  const { sanitized, injectionCount } = sanitizePrompt(raw);

  req.body.prompt    = sanitized;
  req.injectionCount = injectionCount;

  if (injectionCount > 0) {
    logSecurityEvent('prompt_injection_detected', req, {
      injectionCount,
      originalLength:  raw.length,
      sanitizedLength: sanitized.length
    });
  }

  next();
};

module.exports = { promptSanitizer };
