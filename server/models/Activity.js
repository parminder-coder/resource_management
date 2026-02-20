/**
 * Activity Model
 * Handles activity logging for audit trail
 */

const { pool } = require('../config/database');

class Activity {
    /**
     * Log an activity
     */
    static async log(activityData) {
        const {
            user_id,
            action,
            entity_type,
            entity_id,
            details
        } = activityData;
        
        const sql = `
            INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const detailsJson = details ? JSON.stringify(details) : null;
        
        const [result] = await pool.query(sql, [
            user_id,
            action,
            entity_type,
            entity_id,
            detailsJson
        ]);
        
        return result.insertId;
    }
    
    /**
     * Get activity log (admin)
     */
    static async findAll({ page = 1, limit = 50, userId = null, action = '' } = {}) {
        const offset = (page - 1) * limit;
        
        let sql = `
            SELECT al.*, 
                   u.first_name, u.last_name, u.email
            FROM activity_log al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (userId) {
            sql += ` AND al.user_id = ?`;
            params.push(userId);
        }
        
        if (action) {
            sql += ` AND al.action = ?`;
            params.push(action);
        }
        
        sql += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const [rows] = await pool.query(sql, params);
        
        // Parse details JSON
        rows.forEach(row => {
            if (row.details) {
                try {
                    row.details = JSON.parse(row.details);
                } catch (e) {
                    row.details = {};
                }
            }
        });
        
        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM activity_log';
        const countParams = [];
        
        if (userId) {
            countSql += ` WHERE user_id = ?`;
            countParams.push(userId);
        }
        
        if (action) {
            countSql += userId 
                ? ` AND action = ?` 
                : ` WHERE action = ?`;
            countParams.push(action);
        }
        
        const [{ total }] = await pool.query(countSql, countParams);
        
        return {
            activities: rows,
            total: Number(total),
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        };
    }
    
    /**
     * Get recent activity
     */
    static async getRecent(limit = 10) {
        const sql = `
            SELECT al.*, 
                   u.first_name, u.last_name, u.email
            FROM activity_log al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ?
        `;
        
        const [rows] = await pool.query(sql, [limit]);
        
        rows.forEach(row => {
            if (row.details) {
                try {
                    row.details = JSON.parse(row.details);
                } catch (e) {
                    row.details = {};
                }
            }
        });
        
        return rows;
    }
    
    /**
     * Get activity by entity
     */
    static async findByEntity(entityType, entityId) {
        const sql = `
            SELECT al.*, 
                   u.first_name, u.last_name, u.email
            FROM activity_log al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.entity_type = ? AND al.entity_id = ?
            ORDER BY al.created_at DESC
        `;
        
        const [rows] = await pool.query(sql, [entityType, entityId]);
        
        rows.forEach(row => {
            if (row.details) {
                try {
                    row.details = JSON.parse(row.details);
                } catch (e) {
                    row.details = {};
                }
            }
        });
        
        return rows;
    }
}

module.exports = Activity;
