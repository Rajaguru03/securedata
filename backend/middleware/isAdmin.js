/**
 * isAdmin middleware
 * Must run AFTER `protect` (which sets req.user).
 * Rejects if the requests from non admin users with 403.
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

module.exports = { isAdmin };
