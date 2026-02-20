/**
 * Database Initialization Script
 * Run this once to set up your database schema
 * Usage: npm run db:init
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool, initializeDatabase } = require('../config/database');

async function init() {
    console.log('🔄 Initializing database...\n');
    
    // Initialize schema
    const schemaSuccess = await initializeDatabase();
    
    if (!schemaSuccess) {
        console.error('\n❌ Database initialization failed.\n');
        console.error('Please check:');
        console.error('1. Your TiDB Cloud credentials in .env file');
        console.error('2. Your network connection');
        console.error('3. TiDB Cloud cluster status\n');
        process.exit(1);
    }
    
    console.log('✅ Database schema created successfully\n');
    
    // Create sample users with proper password hashes
    console.log('👤 Creating sample users...');
    
    try {
        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);
        
        // Check if admin exists
        const [existingAdmin] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@rms.local']);
        
        if (existingAdmin.length === 0) {
            // Create admin user
            await pool.query(`
                INSERT INTO users (first_name, last_name, email, password_hash, role, department, is_verified)
                VALUES ('Admin', 'User', 'admin@rms.local', ?, 'admin', 'Administration', TRUE)
            `, [adminPassword]);
            console.log('   ✅ Admin user created (email: admin@rms.local, password: admin123)');
        } else {
            console.log('   ℹ️  Admin user already exists');
        }
        
        // Check if sample user exists
        const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', ['john@rms.local']);
        
        if (existingUser.length === 0) {
            // Create sample user
            await pool.query(`
                INSERT INTO users (first_name, last_name, email, password_hash, role, department, year_semester, is_verified)
                VALUES ('John', 'Doe', 'john@rms.local', ?, 'user', 'Computer Science', '3rd Year', TRUE)
            `, [userPassword]);
            console.log('   ✅ Sample user created (email: john@rms.local, password: user123)');
        } else {
            console.log('   ℹ️  Sample user already exists');
        }
        
        console.log('\n✅ Database initialization complete!\n');
        console.log('📊 Default categories have been created.');
        console.log('👤 Sample users created:\n');
        console.log('   Admin:  admin@rms.local  /  admin123');
        console.log('   User:   john@rms.local   /  user123\n');
        console.log('🔐 Change these passwords in production!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error creating sample users:', error.message);
        process.exit(1);
    }
}

init();
