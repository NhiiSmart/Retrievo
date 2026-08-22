const mysql = require('mysql2/promise');

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'lfuser',
      password: 'lfpass',
      database: 'lost_found_portal'
    });
    await conn.ping();
    console.log('✅ Connected successfully!');
    await conn.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}
test();
