const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
    // Create a new user
    async create({ first_name, last_name, email, password, company, role }) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password, company, role) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, company || '', role || 'customer']
        );
        return result.insertId;
    },

    // Find user by email
    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    },

    // Find user by ID
    async findById(id) {
        const [rows] = await pool.query('SELECT id, first_name, last_name, email, company, phone, department, role, status, created_at FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    },

    // Get all users (admin)
    async findAll({ search, role, status, page = 1, limit = 10 }) {
        let query = 'SELECT id, first_name, last_name, email, company, phone, department, role, status, created_at FROM users WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s);
        }
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        // Count total
        const countQuery = query.replace('SELECT id, first_name, last_name, email, company, phone, department, role, status, created_at', 'SELECT COUNT(*) as total');
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0].total;

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const [rows] = await pool.query(query, params);
        return { users: rows, total, page, totalPages: Math.ceil(total / limit) };
    },

    // Update user
    async update(id, data) {
        const fields = [];
        const params = [];
        const allowed = ['first_name', 'last_name', 'email', 'company', 'phone', 'department', 'role', 'status'];
        for (const key of allowed) {
            if (data[key] !== undefined) {
                fields.push(`${key} = ?`);
                params.push(data[key]);
            }
        }
        if (data.password) {
            const salt = await bcrypt.genSalt(10);
            fields.push('password = ?');
            params.push(await bcrypt.hash(data.password, salt));
        }
        if (fields.length === 0) return false;
        params.push(id);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
    },

    // Delete user
    async delete(id) {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return true;
    },

    // Check password
    async matchPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    },

    // Get counts
    async getCounts() {
        const [rows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
            FROM users
        `);
        return rows[0];
    }
};

module.exports = User;
