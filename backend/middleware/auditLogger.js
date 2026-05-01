const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

// Ensures the logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const ACTIVE_LOG    = path.join(logsDir, 'audit.log');
const ROTATION_DAYS = 7;
let currentLogDate  = null;

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Rotating the audit.log if the calendar date has changed since the last write.
 * Archives the old file as audit.YYYY-MM-DD.log and prunes files older than
 * ROTATION_DAYS days. Uses only built-in `fs` — no extra packages needed.
 */
const rotateIfNeeded = () => {
  const today = todayStr();
  if (currentLogDate === today) return;

  if (fs.existsSync(ACTIVE_LOG)) {
    const archiveDate = currentLogDate || (() => {
      try {
        const firstLine = fs.readFileSync(ACTIVE_LOG, 'utf8').split('\n')[0];
        return JSON.parse(firstLine).timestamp?.slice(0, 10) || today;
      } catch { return today; }
    })();
    if (archiveDate !== today) {
      fs.renameSync(ACTIVE_LOG, path.join(logsDir, `audit.${archiveDate}.log`));
    }
  }

  currentLogDate = today;

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ROTATION_DAYS);
    fs.readdirSync(logsDir)
      .filter(f => /^audit\.\d{4}-\d{2}-\d{2}\.log$/.test(f))
      .forEach(f => {
        if (new Date(f.slice(6, 16)) < cutoff)
          fs.unlinkSync(path.join(logsDir, f));
      });
  } catch (e) { console.error('Log pruning error:', e.message); }
};

/**
 * Fire and forget: POST a redacted log entry to LOG_WEBHOOK_URL if configured.
 * Never blocks the caller errors are swallowed with a console warning.
 */
const forwardToWebhook = (payload) => {
  const webhookUrl = process.env.LOG_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const body = JSON.stringify(payload);
    const u = new URL(webhookUrl);
    const transport = u.protocol === 'https:' ? https : http;
    const req = transport.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => res.resume());
    req.on('error', e => console.warn('[AUDIT-WEBHOOK] forward failed:', e.message));
    req.write(body);
    req.end();
  } catch (e) { console.warn('[AUDIT-WEBHOOK] setup failed:', e.message); }
};

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
 * Writes a structured audit log entry to file and console
 */
const writeLog = (entry) => {
  rotateIfNeeded();
  const safe = redact({ ...entry, timestamp: new Date().toISOString() });
  const line = JSON.stringify(safe) + '\n';
  fs.appendFile(ACTIVE_LOG, line, (err) => {
    if (err) console.error('Audit log write error:', err.message);
  });
  console.log('[AUDIT]', line.trim());
  forwardToWebhook(safe);
};

/**
 * Logs the authentication events
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

module.exports = { logAuthEvent, logCardEvent, logSecurityEvent, requestLogger, ACTIVE_LOG, logsDir };
