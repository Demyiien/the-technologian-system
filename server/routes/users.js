const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/users
// Read-only list of real seeded users, used by the frontend to populate the
// Requester / Assigned To dropdowns with valid user IDs (instead of the
// old hardcoded mock roster of names).
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, cluster FROM users ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Failed to fetch users:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

module.exports = router;