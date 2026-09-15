// Simple one-off script to set up the database.
// Usage:
//   node server/initDb.js          -> runs schema.sql only
//   node server/initDb.js --seed   -> runs schema.sql, then seed.sql

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
}

async function main() {
  try {
    console.log('Running schema.sql...');
    await runSqlFile(path.join(__dirname, 'schema.sql'));
    console.log('Schema created (or already existed).');

    if (process.argv.includes('--seed')) {
      console.log('Running seed.sql...');
      await runSqlFile(path.join(__dirname, 'seed.sql'));
      console.log('Seed data inserted.');
    }

    console.log('Done.');
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();