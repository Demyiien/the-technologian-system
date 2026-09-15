require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const requestsRouter = require('./routes/requests');
const usersRouter = require('./routes/users');
const tasksRouter = require('./routes/tasks');
const articlesRouter = require('./routes/articles');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serves the existing frontend (index.html, pages/, css/, js/, assets/)
// from the project root, one directory above this file.
app.use(express.static(path.join(__dirname, '..')));

app.use('/api/requests', requestsRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/articles', articlesRouter);

// Confirms the API is up and that PostgreSQL is reachable.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Technologian API is running',
      database: 'connected',
    });
  } catch (err) {
    console.error('Database health check failed:', err.message);
    res.status(500).json({
      success: false,
      message: 'Technologian API is running, but the database is unreachable',
      database: 'disconnected',
    });
  }
});

// Catches requests to routes that don't exist.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Catches any error thrown or passed to next() in a route handler.
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Technologian server running on http://localhost:${PORT}`);
  });
}

module.exports = app;