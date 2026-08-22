const express = require('express');
const { query } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, status, userId } = req.query;
    let sql = `
      SELECT i.*, u.name AS owner_name
      FROM items i
      LEFT JOIN users u ON u.id = i.user_id
      WHERE 1 = 1
    `;
    const params = [];

    if (search) {
      sql += ' AND (i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category) {
      sql += ' AND i.category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }

    if (userId) {
      sql += ' AND i.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY i.created_at DESC';

    const items = await query(sql, params);

    if (!items.length) {
      return res.json([]);
    }

    const itemIds = items.map((item) => item.id);
    const claims = await query(
      `SELECT c.*, u.name AS claimant_name
       FROM claims c
       LEFT JOIN users u ON u.id = c.claimant_id
       WHERE c.item_id IN (${itemIds.map(() => '?').join(',')})`,
      itemIds
    );

    const claimsByItem = claims.reduce((acc, claim) => {
      if (!acc[claim.item_id]) acc[claim.item_id] = [];
      acc[claim.item_id].push(claim);
      return acc;
    }, {});

    const payload = items.map((item) => ({ ...item, claims: claimsByItem[item.id] || [] }));
    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const itemRows = await query(
      `SELECT i.*, u.name AS owner_name
       FROM items i
       LEFT JOIN users u ON u.id = i.user_id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (!itemRows.length) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = itemRows[0];
    const claims = await query(
      `SELECT c.*, u.name AS claimant_name
       FROM claims c
       LEFT JOIN users u ON u.id = c.claimant_id
       WHERE c.item_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );

    res.json({ ...item, claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, category, location, description, status, image_url, date_lost_found } = req.body;

    if (!title || !category || !location || !description || !status) {
      return res.status(400).json({ error: 'Title, category, location, description, and status are required' });
    }

    const result = await query(
      `INSERT INTO items (user_id, title, category, location, description, status, image_url, date_lost_found)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, category, location, description, status, image_url || null, date_lost_found || null]
    );

    res.status(201).json({ id: result.insertId, ...req.body, user_id: req.user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const itemRows = await query('SELECT user_id FROM items WHERE id = ?', [req.params.id]);
    if (!itemRows.length) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (itemRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own items' });
    }

    const { title, category, location, description, status, image_url, date_lost_found } = req.body;
    await query(
      `UPDATE items
       SET title = ?, category = ?, location = ?, description = ?, status = ?, image_url = ?, date_lost_found = ?
       WHERE id = ?`,
      [title, category, location, description, status, image_url || null, date_lost_found || null, req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const itemRows = await query('SELECT user_id FROM items WHERE id = ?', [req.params.id]);
    if (!itemRows.length) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (itemRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own items' });
    }

    await query('DELETE FROM claims WHERE item_id = ?', [req.params.id]);
    await query('DELETE FROM items WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
