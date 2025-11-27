const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',        
  user: 'root',  
  password: 'mainpassword@', 
  database: 'room_mgmt',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Required to run schema.sql
});

module.exports = pool;