const { pool } = require('../config/db');

const Resource = {
    // Create a new resource
    async create({ name, description, category, status, quantity, cost_per_unit }) {
        const [result] = await pool.query(
            'INSERT INTO resources (name, description, category, status, quantity, available_qty, cost_per_unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description || '', category, status || 'available', quantity || 1, quantity || 1, cost_per_unit || 0]
        );
        return result.insertId;
    },

    // Get resource by ID
    async findById(id) {
        const [rows] = await pool.query(`
            SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
            FROM resources r
            LEFT JOIN users u ON r.assigned_to = u.id
            WHERE r.id = ?
        `, [id]);
        return rows[0] || null;
    },

    // Get all resources with filtering
    async findAll({ search, category, status, page = 1, limit = 10 }) {
        let query = `
            SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
            FROM resources r
            LEFT JOIN users u ON r.assigned_to = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (r.name LIKE ? OR r.description LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s);
        }
        if (category) {
            query += ' AND r.category = ?';
            params.push(category);
        }
        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        // Count
        const countQuery = `SELECT COUNT(*) as total FROM resources r WHERE 1=1` +
            (search ? ' AND (r.name LIKE ? OR r.description LIKE ?)' : '') +
            (category ? ' AND r.category = ?' : '') +
            (status ? ' AND r.status = ?' : '');
        const countParams = [];
        if (search) { const s = `%${search}%`; countParams.push(s, s); }
        if (category) countParams.push(category);
        if (status) countParams.push(status);
        const [countRows] = await pool.query(countQuery, countParams);
        const total = countRows[0].total;

        query += ' ORDER BY r.updated_at DESC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const [rows] = await pool.query(query, params);
        return { resources: rows, total, page, totalPages: Math.ceil(total / limit) };
    },

    // Get available resources for browsing
    async findAvailable({ search, category, page = 1, limit = 12 }) {
        let query = 'SELECT * FROM resources WHERE available_qty > 0';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0].total;

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const [rows] = await pool.query(query, params);
        return { resources: rows, total, page, totalPages: Math.ceil(total / limit) };
    },

    // Update resource
    async update(id, data) {
        const fields = [];
        const params = [];
        const allowed = ['name', 'description', 'category', 'status', 'quantity', 'available_qty', 'cost_per_unit', 'assigned_to'];
        for (const key of allowed) {
            if (data[key] !== undefined) {
                fields.push(`${key} = ?`);
                params.push(data[key]);
            }
        }
        if (fields.length === 0) return false;
        params.push(id);
        await pool.query(`UPDATE resources SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
    },

    // Delete resource
    async delete(id) {
        await pool.query('DELETE FROM resources WHERE id = ?', [id]);
        return true;
    },

    // Get aggregate stats
    async getStats() {
        const [rows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'in-use' THEN 1 ELSE 0 END) as in_use,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
                SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) as retired
            FROM resources
        `);
        const [catRows] = await pool.query(`
            SELECT category, COUNT(*) as count FROM resources GROUP BY category
        `);
        return { ...rows[0], categories: catRows };
    },

    // Get cost overview
    async getCostOverview() {
        const [rows] = await pool.query(`
            SELECT category, SUM(cost_per_unit * quantity) as total_cost, COUNT(*) as count
            FROM resources
            GROUP BY category
        `);
        return rows;
    }
};

module.exports = Resource;
