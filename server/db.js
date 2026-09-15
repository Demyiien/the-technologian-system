const { Pool } = require('pg');

// One shared connection pool for the whole app.
// Other files should require this instead of creating their own Pool.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Catches errors on idle clients so a bad connection doesn't crash the server.
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

module.exports = pool;