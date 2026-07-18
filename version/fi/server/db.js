const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function query(text, params) {
  const started = Date.now();
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    error.query = text;
    throw error;
  } finally {
    const duration = Date.now() - started;
    if (process.env.NODE_ENV === 'development' && duration > 300) {
      console.log(`slow query ${duration}ms`);
    }
  }
}

module.exports = { pool, query };
