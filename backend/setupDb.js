const fs = require('fs');
const path = require('path');
const db = require('./db');

const setupDatabase = async () => {
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // Read the SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Reading schema.sql...');

    // Execute the SQL
    // Note: This relies on multipleStatements: true in db.js
    await db.query(sql);

    console.log('✅ Database setup completed successfully!');
    console.log('🚀 You can now run: node backend/server.js');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    if (error.code === 'ECONNREFUSED') {
        console.error('   -> Is your MySQL server running?');
        console.error('   -> Check host and port in backend/db.js');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('   -> Check your username and password in backend/db.js');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
        console.error('   -> The database "room_mgmt" might not exist yet.');
        console.error('   -> Try creating the database manually in MySQL Workbench first: CREATE DATABASE room_mgmt;');
    }
    process.exit(1);
  }
};

setupDatabase();