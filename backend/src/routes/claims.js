const express = require('express');
const { query } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { itemId, message } = req.body;

    if (!itemId || !message) {
      return res.status(400).json({ error: 'Item ID and message are required' });
    }

    const itemRows = await query('SELECT user_id FROM items WHERE id = ?', [itemId]);
    if (!itemRows.length) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (itemRows[0].user_id === req.user.id) {
      return res.status(403).json({ error: 'You cannot claim your own item' });
    }

    const existing = await query('SELECT id FROM claims WHERE item_id = ? AND claimant_id = ?', [itemId, req.user.id]);
    if (existing.length) {
      return res.status(409).json({ error: 'You already submitted a claim for this item' });
    }

    const result = await query(
      'INSERT INTO claims (item_id, claimant_id, message, status) VALUES (?, ?, ?, ?)',
      [itemId, req.user.id, message, 'pending']
    );

    res.status(201).json({ id: result.insertId, item_id: itemId, claimant_id: req.user.id, message, status: 'pending' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

router.get('/item/:itemId', async (req, res) => {
  try {
    const claims = await query(
      `SELECT c.*, u.name AS claimant_name
       FROM claims c
       LEFT JOIN users u ON u.id = c.claimant_id
       WHERE c.item_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.itemId]
    );
    res.json(claims);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const claimRows = await query('SELECT c.item_id, i.user_id FROM claims c JOIN items i ON i.id = c.item_id WHERE c.id = ?', [req.params.id]);
    if (!claimRows.length) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claimRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the item owner can approve claims' });
    }

    await query('UPDATE claims SET status = ? WHERE id = ?', ['approved', req.params.id]);
    await query('UPDATE items SET status = ? WHERE id = ?', ['resolved', claimRows[0].item_id]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve claim' });
  }
});

router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const claimRows = await query('SELECT c.item_id, i.user_id FROM claims c JOIN items i ON i.id = c.item_id WHERE c.id = ?', [req.params.id]);
    if (!claimRows.length) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claimRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the item owner can reject claims' });
    }

    await query('UPDATE claims SET status = ? WHERE id = ?', ['rejected', req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reject claim' });
  }
});

module.exports = router;
