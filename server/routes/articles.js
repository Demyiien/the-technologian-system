const express = require('express');
const router = express.Router();
const pool = require('../db');

// Valid enum values for the articles table. Kept in sync with schema.sql.
const VALID_STATUSES = ['Draft', 'In Progress', 'For Review', 'Ready', 'Published'];

// Fields a PATCH request is allowed to change. id, created_at, and
// updated_at are intentionally excluded (updated_at is always set by the
// server, never by the client).
const PATCHABLE_FIELDS = ['title', 'description', 'status', 'author_id', 'deadline'];

// Every GET query joins in the author's display name so the frontend
// doesn't have to make an extra request just to show who wrote it.
const SELECT_WITH_JOINS = `
  SELECT
    a.*,
    u.name AS author_name
  FROM articles a
  LEFT JOIN users u ON a.author_id = u.id
`;

// Turns common Postgres errors into a plain-English message instead of
// letting the server crash or leak raw database details.
function friendlyDbError(err) {
  if (err.code === '23503') {
    return 'The referenced author does not exist.';
  }
  if (err.code === '23514') {
    return 'Status must be one of the allowed values.';
  }
  return null;
}

// GET /api/articles
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_WITH_JOINS} ORDER BY a.created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Failed to fetch articles:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch articles' });
  }
});

// GET /api/articles/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_WITH_JOINS} WHERE a.id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Failed to fetch article:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch article' });
  }
});

// POST /api/articles
router.post('/', async (req, res) => {
  const { title, description, status, author_id, deadline } = req.body;

  const missing = [];
  if (title === undefined || title === null || String(title).trim() === '') missing.push('title');
  if (author_id === undefined || author_id === null || author_id === '') missing.push('author_id');

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: missing.length === 1 && missing[0] === 'title'
        ? 'Title is required'
        : `Missing required field(s): ${missing.join(', ')}`,
    });
  }

  if (status !== undefined && status !== null && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
  }

  // Build the INSERT dynamically so an omitted status is left out entirely
  // (rather than sent as NULL), letting PostgreSQL's own column default
  // ('Draft') apply, per schema.sql.
  const candidateFields = {
    title,
    description: description || null,
    status,
    author_id,
    deadline: deadline || null,
  };
  const providedFields = Object.entries(candidateFields).filter(([, value]) => value !== undefined);
  const columns = providedFields.map(([key]) => key);
  const placeholders = providedFields.map((_, i) => `$${i + 1}`);
  const values = providedFields.map(([, value]) => value);

  try {
    const result = await pool.query(
      `INSERT INTO articles (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
      values
    );

    const created = await pool.query(`${SELECT_WITH_JOINS} WHERE a.id = $1`, [result.rows[0].id]);
    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (err) {
    const friendly = friendlyDbError(err);
    if (friendly) {
      return res.status(400).json({ success: false, message: friendly });
    }
    console.error('Failed to create article:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create article' });
  }
});

// PATCH /api/articles/:id
router.patch('/:id', async (req, res) => {
  const fieldsToUpdate = Object.keys(req.body).filter((key) => PATCHABLE_FIELDS.includes(key));

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({
      success: false,
      message: `No valid fields provided. Allowed fields: ${PATCHABLE_FIELDS.join(', ')}`,
    });
  }

  if (req.body.title !== undefined && String(req.body.title).trim() === '') {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
  }
  if (req.body.author_id !== undefined && (req.body.author_id === null || req.body.author_id === '')) {
    return res.status(400).json({ success: false, message: 'author_id cannot be empty' });
  }

  const setClause = fieldsToUpdate.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const values = fieldsToUpdate.map((field) => req.body[field]);
  values.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE articles SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING id`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const updated = await pool.query(`${SELECT_WITH_JOINS} WHERE a.id = $1`, [result.rows[0].id]);
    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    const friendly = friendlyDbError(err);
    if (friendly) {
      return res.status(400).json({ success: false, message: friendly });
    }
    console.error('Failed to update article:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update article' });
  }
});

// DELETE /api/articles/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM articles WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    // requests.article_id and tasks.article_id reference articles(id) with
    // no ON DELETE behavior specified, so PostgreSQL blocks the delete
    // (23503 = foreign_key_violation) instead of silently orphaning rows.
    if (err.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete article because it is referenced by an existing request or task.',
      });
    }
    console.error('Failed to delete article:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete article' });
  }
});

module.exports = router;