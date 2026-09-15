const express = require('express');
const router = express.Router();
const pool = require('../db');

// Valid enum values for the tasks table. Kept in sync with schema.sql.
const VALID_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const VALID_STATUSES = ['Not Started', 'In Progress', 'Review', 'Completed'];
const VALID_CLUSTERS = ['Writing', 'Creatives', 'Online & Digital'];

// Fields a PATCH request is allowed to change. id and created_at are
// intentionally excluded.
const PATCHABLE_FIELDS = [
  'title',
  'description',
  'assignee_id',
  'cluster',
  'priority',
  'status',
  'deadline',
  'article_id',
  'request_id',
];

// Every GET query joins in the display-friendly names/titles so the
// frontend doesn't have to make extra requests just to show a task.
const SELECT_WITH_JOINS = `
  SELECT
    t.*,
    u.name AS assignee_name,
    a.title AS article_title,
    r.subject AS request_subject
  FROM tasks t
  LEFT JOIN users u ON t.assignee_id = u.id
  LEFT JOIN articles a ON t.article_id = a.id
  LEFT JOIN requests r ON t.request_id = r.id
`;

// Turns common Postgres errors into a plain-English message instead of
// letting the server crash or leak raw database details.
function friendlyDbError(err) {
  if (err.code === '23503') {
    return 'One of the referenced IDs (assignee, article, or request) does not exist, or another record still depends on this row.';
  }
  if (err.code === '23514') {
    return 'One of the field values is not allowed (check cluster, priority, or status).';
  }
  return null;
}

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_WITH_JOINS} ORDER BY t.created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Failed to fetch tasks:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_WITH_JOINS} WHERE t.id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Failed to fetch task:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const {
    title, description, assignee_id, cluster, priority, status, deadline, article_id, request_id,
  } = req.body;

  // Required per schema.sql: title and cluster have NOT NULL constraints
  // and no default. priority/status also have NOT NULL constraints, but
  // schema.sql already gives them defaults ('Normal' / 'Not Started'), so
  // they're optional here — we simply omit them from the INSERT below
  // when not supplied, letting PostgreSQL apply its own default.
  const required = { title, cluster };
  const missing = Object.entries(required)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required field(s): ${missing.join(', ')}`,
    });
  }

  if (!VALID_CLUSTERS.includes(cluster)) {
    return res.status(400).json({
      success: false,
      message: `Invalid cluster. Allowed values: ${VALID_CLUSTERS.join(', ')}`,
    });
  }
  if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}`,
    });
  }
  if (status !== undefined && status !== null && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
  }

  // Build the INSERT dynamically so fields the client didn't send (e.g.
  // priority, status) are left out entirely instead of being sent as NULL —
  // that way PostgreSQL's own column defaults apply, per schema.sql.
  const candidateFields = {
    title,
    description,
    assignee_id: assignee_id || null,
    cluster,
    priority,
    status,
    deadline: deadline || null,
    article_id: article_id || null,
    request_id: request_id || null,
  };
  const providedFields = Object.entries(candidateFields).filter(([, value]) => value !== undefined);
  const columns = providedFields.map(([key]) => key);
  const placeholders = providedFields.map((_, i) => `$${i + 1}`);
  const values = providedFields.map(([, value]) => value);

  try {
    const result = await pool.query(
      `INSERT INTO tasks (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
      values
    );

    // Re-select through the same joined query used by GET so the response
    // includes assignee_name / article_title / request_subject.
    const created = await pool.query(`${SELECT_WITH_JOINS} WHERE t.id = $1`, [result.rows[0].id]);
    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (err) {
    const friendly = friendlyDbError(err);
    if (friendly) {
      return res.status(400).json({ success: false, message: friendly });
    }
    console.error('Failed to create task:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
  const fieldsToUpdate = Object.keys(req.body).filter((key) => PATCHABLE_FIELDS.includes(key));

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({
      success: false,
      message: `No valid fields provided. Allowed fields: ${PATCHABLE_FIELDS.join(', ')}`,
    });
  }

  if (req.body.cluster !== undefined && !VALID_CLUSTERS.includes(req.body.cluster)) {
    return res.status(400).json({
      success: false,
      message: `Invalid cluster. Allowed values: ${VALID_CLUSTERS.join(', ')}`,
    });
  }
  if (req.body.priority !== undefined && !VALID_PRIORITIES.includes(req.body.priority)) {
    return res.status(400).json({
      success: false,
      message: `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}`,
    });
  }
  if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
  }
  if (req.body.title !== undefined && String(req.body.title).trim() === '') {
    return res.status(400).json({ success: false, message: 'Title cannot be empty' });
  }

  const setClause = fieldsToUpdate.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const values = fieldsToUpdate.map((field) => req.body[field]);
  values.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING id`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const updated = await pool.query(`${SELECT_WITH_JOINS} WHERE t.id = $1`, [result.rows[0].id]);
    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    const friendly = friendlyDbError(err);
    if (friendly) {
      return res.status(400).json({ success: false, message: friendly });
    }
    console.error('Failed to update task:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    console.error('Failed to delete task:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
});

module.exports = router;