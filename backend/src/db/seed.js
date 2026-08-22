const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function seedDatabase() {
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  const connection = await pool.getConnection();
  try {
    await connection.query(sql);
    console.log('Database seeded successfully');
  } finally {
    connection.release();
  }
}

seedDatabase().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
