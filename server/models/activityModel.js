const { pool } = require('../config/db');

const Activity = {
    // Log an activity
    async log({ user_id, action, details, entity_type, entity_id }) {
        await pool.query(
            'INSERT INTO activity_log (user_id, action, details, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
            [user_id || null, action, details || '', entity_type || '', entity_id || null]
        );
    },

    // Get recent activity (admin)
    async getRecent(limit = 20) {
        const [rows] = await pool.query(`
            SELECT al.*, CONCAT(u.first_name, ' ', u.last_name) as user_name
            FROM activity_log al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ?
        `, [limit]);
        return rows;
    }
};

module.exports = Activity;
