const express  = require('express');
const router   = express.Router();
const fs       = require('fs');
const path     = require('path');
const { protect }            = require('../middleware/auth');
const { isAdmin }            = require('../middleware/isAdmin');
const { ACTIVE_LOG, logsDir } = require('../middleware/auditLogger');

// All admin routes require authentication + admin role
router.use(protect, isAdmin);

/**
 * GET /api/admin/logs
 *
 * Query params:
 *   type    — filter by log entry type (AUTH | CARD | SECURITY | REQUEST | LLM)
 *   event   — filter by exact event string
 *   userId  — filter by userId field
 *   since   — ISO timestamp; only entries at or after this time
 *   limit   — max entries to return (default 50, max 500)
 *   date    — YYYY-MM-DD; read a specific rotated archive instead of today's log
 */
router.get('/logs', (req, res) => {
  try {
    const { type, event, userId, since, limit = '50', date } = req.query;

    let targetFile;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      }
      targetFile = path.join(logsDir, `audit.${date}.log`);
    } else {
      targetFile = ACTIVE_LOG;
    }

    if (!fs.existsSync(targetFile)) {
      return res.status(404).json({ error: 'Log file not found for the requested date.' });
    }

    const maxLimit  = Math.min(parseInt(limit, 10) || 50, 500);
    const sinceDate = since ? new Date(since) : null;

    const raw     = fs.readFileSync(targetFile, 'utf8');
    const entries = [];

    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const entry = JSON.parse(trimmed);
        if (type   && entry.type   !== type)   continue;
        if (event  && entry.event  !== event)   continue;
        if (userId && entry.userId !== userId)  continue;
        if (sinceDate && new Date(entry.timestamp) < sinceDate) continue;
        entries.push(entry);
        if (entries.length >= maxLimit) break;
      } catch {
        // Skip malformed lines
      }
    }

    res.status(200).json({ success: true, count: entries.length, data: { logs: entries } });

  } catch (err) {
    console.error('Admin logs error:', err.message);
    res.status(500).json({ error: 'Failed to read logs.' });
  }
});

/**
 * GET /api/admin/logs/files
 * Lists all available log files (active + rotated archives) with size and mtime.
 */
router.get('/logs/files', (req, res) => {
  try {
    const files = fs.readdirSync(logsDir)
      .filter(f => /^audit(\.\d{4}-\d{2}-\d{2})?\.log$/.test(f))
      .map(f => {
        const stat = fs.statSync(path.join(logsDir, f));
        return { file: f, sizeBytes: stat.size, modified: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.file.localeCompare(a.file)); // newest first

    res.status(200).json({ success: true, data: { files } });
  } catch (err) {
    console.error('Admin log files error:', err.message);
    res.status(500).json({ error: 'Failed to list log files.' });
  }
});

module.exports = router;
