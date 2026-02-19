const { pool } = require('../config/db');

const Allocation = {
    // Create allocation
    async create({ user_id, resource_id, request_id, return_due }) {
        const [result] = await pool.query(
            'INSERT INTO allocations (user_id, resource_id, request_id, return_due) VALUES (?, ?, ?, ?)',
            [user_id, resource_id, request_id || null, return_due || null]
        );
        return result.insertId;
    },

    // Get allocations for a user
    async findByUser(userId) {
        const [rows] = await pool.query(`
            SELECT a.*, r.name as resource_name, r.category as resource_category, r.description as resource_description
            FROM allocations a
            JOIN resources r ON a.resource_id = r.id
            WHERE a.user_id = ? AND a.status != 'returned'
            ORDER BY a.assigned_date DESC
        `, [userId]);
        return rows;
    },

    // Get all allocations (admin)
    async findAll() {
        const [rows] = await pool.query(`
            SELECT a.*, r.name as resource_name, r.category as resource_category,
                   CONCAT(u.first_name, ' ', u.last_name) as user_name
            FROM allocations a
            JOIN resources r ON a.resource_id = r.id
            JOIN users u ON a.user_id = u.id
            ORDER BY a.assigned_date DESC
        `);
        return rows;
    },

    // Return a resource
    async returnResource(allocationId, userId) {
        const [rows] = await pool.query('SELECT * FROM allocations WHERE id = ? AND user_id = ?', [allocationId, userId]);
        if (rows.length === 0) return null;

        const allocation = rows[0];
        await pool.query('UPDATE allocations SET status = ?, returned_date = CURRENT_DATE WHERE id = ?', ['returned', allocationId]);
        // Increase available qty
        await pool.query('UPDATE resources SET available_qty = available_qty + 1 WHERE id = ?', [allocation.resource_id]);
        // If no other active allocations, set resource to available
        const [activeAlloc] = await pool.query('SELECT COUNT(*) as count FROM allocations WHERE resource_id = ? AND status = ?', [allocation.resource_id, 'active']);
        if (activeAlloc[0].count === 0) {
            await pool.query("UPDATE resources SET status = 'available', assigned_to = NULL WHERE id = ?", [allocation.resource_id]);
        }
        return allocation;
    },

    // Count active allocations for a user
    async countByUser(userId) {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM allocations WHERE user_id = ? AND status = 'active'", [userId]);
        return rows[0].count;
    },

    // Get nearest return due date for a user
    async nearestReturn(userId) {
        const [rows] = await pool.query(`
            SELECT return_due FROM allocations 
            WHERE user_id = ? AND status = 'active' AND return_due IS NOT NULL
            ORDER BY return_due ASC LIMIT 1
        `, [userId]);
        return rows[0]?.return_due || null;
    }
};

module.exports = Allocation;
