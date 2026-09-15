const express = require('express');
const router = express.Router();
const pool = require('../db');

// Fields a PATCH request is allowed to change.
const PATCHABLE_FIELDS = [
  'target_cluster',
  'request_type',
  'subject',
  'description',
  'priority',
  'deadline',
  'status',
  'assigned_to',
  'article_id',
];

// Every GET query joins in the display-friendly names/titles so the
// frontend doesn't have to make extra requests just to show a request.
const SELECT_WITH_JOINS = `
  SELECT
    r.*,
    ru.name AS requester_name,
    au.name AS assigned_name,
    a.title AS article_title
  FROM requests r
  LEFT JOIN users ru ON r.requester_id = ru.id
  LEFT JOIN users au ON r.assigned_to = au.id
  LEFT JOIN articles a ON r.article_id = a.id
`;

// Turns common Postgres errors into a plain-English message instead of
// letting the server crash or leak raw database details.
function friendlyDbError(err) {
  if (err.code === '23503') {
    return 'One of the referenced IDs (requester, assigned user, or article) does not exist, or another record still depends on this row.';
  }
  if (err.code === '23514') {
    return 'One of the field values is not allowed (check target_cluster, request_type, priority, or status).';
  }
  return null;
}

// GET /api/requests
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_WITH_JOINS} ORDER BY r.created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Failed to fetch requests:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// GET /api/requests/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_WITH_JOINS} WHERE r.id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Failed to fetch request:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch request' });
  }
});

// POST /api/requests
router.post('/', async (req, res) => {
  const {
    requester_id, target_cluster, request_type, subject, description,
    priority, deadline, article_id, assigned_to,
  } = req.body;

  const required = { requester_id, target_cluster, request_type, subject, description, priority, deadline };
  const missing = Object.entries(required)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required field(s): ${missing.join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO requests
        (requester_id, target_cluster, request_type, subject, description, priority, deadline, article_id, assigned_to, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
       RETURNING *`,
      [requester_id, target_cluster, request_type, subject, description, priority, deadline, article_id || null, assigned_to || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const friendly = friendlyDbError(err);
    if (friendly) {
      return res.status(400).json({ success: false, message: friendly });
    }
    console.error('Failed to create request:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create request' });
  }
});

// PATCH /api/requests/:id
router.patch('/:id', async (req, res) => {
  const fieldsToUpdate = Object.keys(req.body).filter((key) => PATCHABLE_FIELDS.includes(key));

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({
      success: false,
      message: `No valid fields provided. Allowed fields: ${PATCHABLE_FIELDS.join(', ')}`,
    });
  }

  const setClause = fieldsToUpdate.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const values = fieldsToUpdate.map((field) => req.body[field]);
  values.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE requests SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    const friendly = friendlyDbError(err);
    if (friendly) {
      return res.status(400).json({ success: false, message: friendly });
    }
    console.error('Failed to update request:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

// DELETE /api/requests/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM requests WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete this request because a task is still linked to it.',
      });
    }
    console.error('Failed to delete request:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete request' });
  }
});

module.exports = router;