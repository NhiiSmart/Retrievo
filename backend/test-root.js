const mysql = require('mysql2/promise');

async function testRoot() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',  // Try blank password first
      database: 'lost_found_portal'
    });
    await conn.ping();
    console.log('✅ Root connected successfully!');
    
    // Check if lfuser exists
    const [users] = await conn.query("SELECT User FROM mysql.user WHERE User='lfuser'");
    if (users.length > 0) {
      console.log('✅ lfuser exists');
    } else {
      console.log('❌ lfuser does NOT exist');
      console.log('Run this SQL to create it:');
      console.log("CREATE USER 'lfuser'@'localhost' IDENTIFIED BY 'lfpass';");
      console.log("GRANT ALL PRIVILEGES ON lost_found_portal.* TO 'lfuser'@'localhost';");
      console.log("FLUSH PRIVILEGES;");
    }
    await conn.end();
  } catch (err) {
    console.error('❌ Root connection failed:', err.message);
    console.log('Try password: root or no password');
  }
}
testRoot();
