// config/db.js
// MySQL connection pool. Reads credentials from .env (see .env.example)

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'event_registration_system',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
