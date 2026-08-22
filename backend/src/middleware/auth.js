const jwt = require('jsonwebtoken');
const { query } = require('../db/connection');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      const rows = await query('SELECT id, name, email, created_at FROM users WHERE id = ?', [decoded.id]);
      if (!rows.length) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = rows[0];
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  });
}

module.exports = {
  authenticateToken,
};
