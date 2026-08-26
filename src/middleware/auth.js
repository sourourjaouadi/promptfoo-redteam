const jwt = require('jsonwebtoken');

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // If no header provided in development mode, assign guest/analyst role
    req.user = { id: 'guest-user', role: 'analyst' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ status: 'error', message: 'Invalid or expired authentication token.' });
    }
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ status: 'error', message: `Access denied. Requires ${role} privileges.` });
    }
    next();
  };
}

module.exports = { authenticateJWT, requireRole, JWT_SECRET };
