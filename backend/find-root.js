const mysql = require('mysql2/promise');

const passwords = ['', 'root', 'password', 'mysql', 'admin', '123456', '1234', '12345', 'root123', 'password123'];

async function tryPasswords() {
  let found = false;
  for (const pwd of passwords) {
    try {
      const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: pwd
      });
      console.log('SUCCESS! Password is: "' + pwd + '"');
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
      console.log('lfuser created successfully!');
      await conn2.end();
      found = true;
      break;
    } catch (err) {
      console.log('Failed with password: "' + pwd + '"');
    }
  }
  if (!found) {
    console.log('Could not connect with any common password');
    console.log('You need to reset MySQL root password');
  }
}
tryPasswords();
