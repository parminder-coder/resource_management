/**
 * User Model
 * Handles all user-related database operations
 */

const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    /**
     * Create a new user
     */
    static async create(userData) {
        const {
            first_name,
            last_name,
            email,
            password,
            phone,
            department
        } = userData;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const sql = `
            INSERT INTO users (first_name, last_name, email, password_hash, phone, department)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(sql, [
            first_name,
            last_name,
            email,
            password_hash,
            phone,
            department
        ]);

        return result.insertId;
    }
    
    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.query(sql, [email]);
        return rows[0] || null;
    }
    
    /**
     * Find user by ID
     */
    static async findById(id) {
        const sql = 'SELECT id, first_name, last_name, email, role, phone, department, is_verified, is_blocked, created_at FROM users WHERE id = ?';
        const [rows] = await pool.query(sql, [id]);
        return rows[0] || null;
    }
    
    /**
     * Verify password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    
    /**
     * Update user profile
     */
    static async update(id, userData) {
        const allowedFields = ['first_name', 'last_name', 'phone', 'department'];
        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(userData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) return false;

        values.push(id);
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(sql, values);

        return result.affectedRows > 0;
    }
    
    /**
     * Change password
     */
    static async changePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);
        
        const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
        const [result] = await pool.query(sql, [password_hash, id]);
        
        return result.affectedRows > 0;
    }
    
    /**
     * Get all users (admin)
     */
    static async findAll({ page = 1, limit = 10, search = '', role = '' } = {}) {
        const offset = (page - 1) * limit;
        let sql = `
            SELECT id, first_name, last_name, email, role, phone, department, is_verified, is_blocked, created_at
            FROM users
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (role) {
            sql += ` AND role = ?`;
            params.push(role);
        }

        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(sql, params);

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const countParams = [];

        if (search) {
            countSql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (role) {
            countSql += ` AND role = ?`;
            countParams.push(role);
        }

        const [{ total }] = await pool.query(countSql, countParams);

        return {
            users: rows,
            total: Number(total),
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        };
    }
    
    /**
     * Delete user
     */
    static async delete(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
    
    /**
     * Verify/unverify user (admin)
     */
    static async setVerified(id, isVerified) {
        const sql = 'UPDATE users SET is_verified = ? WHERE id = ?';
        const [result] = await pool.query(sql, [isVerified, id]);
        return result.affectedRows > 0;
    }
    
    /**
     * Block/unblock user (admin)
     */
    static async setBlocked(id, isBlocked) {
        const sql = 'UPDATE users SET is_blocked = ? WHERE id = ?';
        const [result] = await pool.query(sql, [isBlocked, id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;
