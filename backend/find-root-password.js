const mysql = require('mysql2/promise');

const passwords = ['', 'root', 'password', 'mysql', 'admin', '123456'];

async function tryPasswords() {
  for (const pwd of passwords) {
    try {
      const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: pwd
      });
      console.log(\✅ Root connected! Password is: '\C:\Users\LEO\OneDrive\Lost-found-portal\backend'\);
      await conn.end();
      
      // Now create lfuser
      const conn2 = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: pwd
      });
      await conn2.query("CREATE DATABASE IF NOT EXISTS lost_found_portal");
      await conn2.query("CREATE USER IF NOT EXISTS 'lfuser'@'localhost' IDENTIFIED BY 'lfpass'");
      await conn2.query("GRANT ALL PRIVILEGES ON lost_found_portal.* TO 'lfuser'@'localhost'");
      await conn2.query("FLUSH PRIVILEGES");
      console.log('✅ lfuser created successfully!');
      await conn2.end();
      return;
    } catch (err) {
      console.log(\❌ Failed with password: '\C:\Users\LEO\OneDrive\Lost-found-portal\backend'\);
    }
  }
  console.log('❌ Could not connect with any common password');
}
tryPasswords();
