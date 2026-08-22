const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d',
  });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const user = { id: result.insertId, name, email, created_at: new Date().toISOString() };
    const token = createToken(user);

    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await query('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
    const token = createToken(safeUser);

    res.json({ token, user: safeUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
