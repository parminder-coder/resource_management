/**
 * Database Configuration
 * TiDB Cloud Connection Pool
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // TiDB Cloud requires SSL
    ssl: {
        rejectUnauthorized: true
    }
});

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Initialize database (create tables if not exist)
async function initializeDatabase() {
    const fs = require('fs');
    const path = require('path');

    try {
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');

        // Remove comments and split by semicolons
        schema = schema
            .replace(/--.*$/gm, '')  // Remove single-line comments
            .replace(/\n\s*\n/g, '\n'); // Remove empty lines

        // Split by semicolons and execute each statement
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                await pool.query(statement);
            }
        }

        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
});

module.exports = {
    pool,
    testConnection,
    initializeDatabase
};
