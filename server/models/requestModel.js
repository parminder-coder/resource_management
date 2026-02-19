const { pool } = require('../config/db');

const Request = {
    // Create a new request
    async create({ user_id, resource_id, reason, priority, needed_by }) {
        const [result] = await pool.query(
            'INSERT INTO requests (user_id, resource_id, reason, priority, needed_by) VALUES (?, ?, ?, ?, ?)',
            [user_id, resource_id, reason, priority || 'medium', needed_by || null]
        );
        return result.insertId;
    },

    // Get request by ID
    async findById(id) {
        const [rows] = await pool.query(`
            SELECT req.*, 
                   res.name as resource_name, res.category as resource_category,
                   CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email,
                   CONCAT(rev.first_name, ' ', rev.last_name) as reviewer_name
            FROM requests req
            JOIN resources res ON req.resource_id = res.id
            JOIN users u ON req.user_id = u.id
            LEFT JOIN users rev ON req.reviewed_by = rev.id
            WHERE req.id = ?
        `, [id]);
        return rows[0] || null;
    },

    // Get all requests (admin view)
    async findAll({ status, page = 1, limit = 10 }) {
        let query = `
            SELECT req.*, 
                   res.name as resource_name, res.category as resource_category,
                   CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email
            FROM requests req
            JOIN resources res ON req.resource_id = res.id
            JOIN users u ON req.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND req.status = ?';
            params.push(status);
        }

        const countBase = `SELECT COUNT(*) as total FROM requests req WHERE 1=1` + (status ? ' AND req.status = ?' : '');
        const [countRows] = await pool.query(countBase, status ? [status] : []);
        const total = countRows[0].total;

        query += ' ORDER BY req.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const [rows] = await pool.query(query, params);
        return { requests: rows, total, page, totalPages: Math.ceil(total / limit) };
    },

    // Get requests by user ID (customer view)
    async findByUser(userId, { page = 1, limit = 10 }) {
        const [countRows] = await pool.query('SELECT COUNT(*) as total FROM requests WHERE user_id = ?', [userId]);
        const total = countRows[0].total;

        const [rows] = await pool.query(`
            SELECT req.*, 
                   res.name as resource_name, res.category as resource_category,
                   CONCAT(rev.first_name, ' ', rev.last_name) as reviewer_name
            FROM requests req
            JOIN resources res ON req.resource_id = res.id
            LEFT JOIN users rev ON req.reviewed_by = rev.id
            WHERE req.user_id = ?
            ORDER BY req.created_at DESC LIMIT ? OFFSET ?
        `, [userId, limit, (page - 1) * limit]);

        return { requests: rows, total, page, totalPages: Math.ceil(total / limit) };
    },

    // Approve request
    async approve(id, reviewerId, adminNote) {
        await pool.query(
            'UPDATE requests SET status = ?, reviewed_by = ?, admin_note = ? WHERE id = ?',
            ['approved', reviewerId, adminNote || '', id]
        );
        return true;
    },

    // Reject request
    async reject(id, reviewerId, adminNote) {
        await pool.query(
            'UPDATE requests SET status = ?, reviewed_by = ?, admin_note = ? WHERE id = ?',
            ['rejected', reviewerId, adminNote || '', id]
        );
        return true;
    },

    // Cancel request (by user)
    async cancel(id) {
        await pool.query('DELETE FROM requests WHERE id = ? AND status = ?', [id, 'pending']);
        return true;
    },

    // Get counts
    async getCounts(userId) {
        let query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM requests
        `;
        const params = [];
        if (userId) {
            query += ' WHERE user_id = ?';
            params.push(userId);
        }
        const [rows] = await pool.query(query, params);
        return rows[0];
    }
};

module.exports = Request;
