const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'audit.log');

// Fields that must never appear in log output
const SENSITIVE_KEYS = new Set([
  'password', 'confirmPassword', 'currentPassword', 'newPassword',
  'token', 'accessToken', 'refreshToken', 'authorization',
  'secret', 'apiKey', 'api_key', 'encryptionKey', 'jwt',
  'creditCard', 'cvv', 'ssn'
]);

/**
 * Recursively scrub sensitive keys from an object before logging.
 */
const redact = (obj, depth = 0) => {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (SENSITIVE_KEYS.has(k.toLowerCase()) || SENSITIVE_KEYS.has(k)) {
        return [k, '[REDACTED]'];
      }
      return [k, typeof v === 'object' ? redact(v, depth + 1) : v];
    })
  );
};

/**
 * Write a structured audit log entry to file and console
 */
const writeLog = (entry) => {
  const safe = redact({ ...entry, timestamp: new Date().toISOString() });
  const line = JSON.stringify(safe) + '\n';
  fs.appendFile(logFile, line, (err) => {
    if (err) console.error('Audit log write error:', err.message);
  });
  // Mirror to stdout so logs are visible in server output
  console.log('[AUDIT]', line.trim());
};

/**
 * Log authentication events
 * @param {'register'|'login_success'|'login_failure'|'invalid_token'|'token_expired'} event
 * @param {Object} req - Express request
 * @param {Object} [extra] - Additional fields (e.g. userId, reason)
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  return `${local[0]}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
};

const logAuthEvent = (event, req, extra = {}) => {
  writeLog({
    type: 'AUTH',
    event,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    email: maskEmail(req.body?.email),
    ...extra
  });
};

/**
 * Log datacard access events
 * @param {'create'|'read'|'update'|'delete'|'share'|'share_revoke'|'shared_view'|'unauthorized'} event
 * @param {Object} req - Express request
 * @param {Object} [extra] - Additional fields (e.g. cardId, ownerId)
 */
const logCardEvent = (event, req, extra = {}) => {
  writeLog({
    type: 'CARD',
    event,
    ip: req.ip || req.connection?.remoteAddress,
    userId: req.user?.id,
    cardId: req.params?.id || extra.cardId,
    ...extra
  });
};

/**
 * Log security violations (rate limit hits, invalid IDs, etc.)
 * @param {string} event
 * @param {Object} req - Express request
 * @param {Object} [extra]
 */
const logSecurityEvent = (event, req, extra = {}) => {
  writeLog({
    type: 'SECURITY',
    event,
    ip: req.ip || req.connection?.remoteAddress,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ...extra
  });
};

/**
 * Express middleware: logs every incoming request at INFO level
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log non-200 responses or slow requests to keep noise down
    if (res.statusCode >= 400 || duration > 1000) {
      writeLog({
        type: 'REQUEST',
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: duration,
        ip: req.ip || req.connection?.remoteAddress,
        userId: req.user?.id
      });
    }
  });
  next();
};

module.exports = { logAuthEvent, logCardEvent, logSecurityEvent, requestLogger };
