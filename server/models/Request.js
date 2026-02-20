/**
 * Request Model
 * Handles all resource request-related database operations
 */

const { pool } = require('../config/database');

class Request {
    /**
     * Create a new request
     */
    static async create(requestData) {
        const {
            resource_id,
            requester_id,
            owner_id,
            message,
            duration
        } = requestData;
        
        const sql = `
            INSERT INTO requests (resource_id, requester_id, owner_id, message, duration)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(sql, [
            resource_id,
            requester_id,
            owner_id,
            message,
            duration
        ]);
        
        return result.insertId;
    }
    
    /**
     * Find request by ID
     */
    static async findById(id) {
        const sql = `
            SELECT req.*, 
                   r.title as resource_title, r.category_id,
                   req_u.first_name as requester_first_name, req_u.last_name as requester_last_name, req_u.email as requester_email,
                   own.first_name as owner_first_name, own.last_name as owner_last_name, own.email as owner_email
            FROM requests req
            JOIN resources r ON req.resource_id = r.id
            JOIN users req_u ON req.requester_id = req_u.id
            JOIN users own ON req.owner_id = own.id
            WHERE req.id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        return rows[0] || null;
    }
    
    /**
     * Get requests sent by a user
     */
    static async findByRequester(requesterId, { page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        
        const sql = `
            SELECT req.*, 
                   r.title as resource_title, r.category_id, c.name as category_name,
                   own.first_name as owner_first_name, own.last_name as owner_last_name, own.email as owner_email
            FROM requests req
            JOIN resources r ON req.resource_id = r.id
            JOIN categories c ON r.category_id = c.id
            JOIN users own ON req.owner_id = own.id
            WHERE req.requester_id = ?
            ORDER BY req.requested_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(sql, [requesterId, limit, offset]);
        
        // Get total count
        const [{ total }] = await pool.query(
            'SELECT COUNT(*) as total FROM requests WHERE requester_id = ?',
            [requesterId]
        );
        
        return {
            requests: rows,
            total: Number(total),
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        };
    }
    
    /**
     * Get requests received by a user (as owner)
     */
    static async findByOwner(ownerId, { page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        
        const sql = `
            SELECT req.*, 
                   r.title as resource_title, r.category_id, c.name as category_name,
                   req_u.first_name as requester_first_name, req_u.last_name as requester_last_name, req_u.email as requester_email
            FROM requests req
            JOIN resources r ON req.resource_id = r.id
            JOIN categories c ON r.category_id = c.id
            JOIN users req_u ON req.requester_id = req_u.id
            WHERE req.owner_id = ?
            ORDER BY req.requested_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(sql, [ownerId, limit, offset]);
        
        // Get total count
        const [{ total }] = await pool.query(
            'SELECT COUNT(*) as total FROM requests WHERE owner_id = ?',
            [ownerId]
        );
        
        return {
            requests: rows,
            total: Number(total),
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        };
    }
    
    /**
     * Get all requests (admin)
     */
    static async findAll({ status = '', page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;
        
        let sql = `
            SELECT req.*, 
                   r.title as resource_title, r.category_id, c.name as category_name,
                   req_u.first_name as requester_first_name, req_u.last_name as requester_last_name, req_u.email as requester_email,
                   own.first_name as owner_first_name, own.last_name as owner_last_name
            FROM requests req
            JOIN resources r ON req.resource_id = r.id
            JOIN categories c ON r.category_id = c.id
            JOIN users req_u ON req.requester_id = req_u.id
            JOIN users own ON req.owner_id = own.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            sql += ` AND req.status = ?`;
            params.push(status);
        }
        
        sql += ` ORDER BY req.requested_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const [rows] = await pool.query(sql, params);
        
        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM requests';
        const countParams = [];
        
        if (status) {
            countSql += ` WHERE status = ?`;
            countParams.push(status);
        }
        
        const [{ total }] = await pool.query(countSql, countParams);
        
        return {
            requests: rows,
            total: Number(total),
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        };
    }
    
    /**
     * Update request status
     */
    static async updateStatus(id, status, adminNote = null) {
        const sql = `
            UPDATE requests 
            SET status = ?, responded_at = CURRENT_TIMESTAMP, admin_note = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(sql, [status, adminNote, id]);
        return result.affectedRows > 0;
    }
    
    /**
     * Approve request
     */
    static async approve(id, adminNote = null) {
        return await this.updateStatus(id, 'approved', adminNote);
    }
    
    /**
     * Reject request
     */
    static async reject(id, adminNote = null) {
        return await this.updateStatus(id, 'rejected', adminNote);
    }
    
    /**
     * Mark as returned
     */
    static async markReturned(id) {
        const sql = `
            UPDATE requests 
            SET status = 'returned', returned_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
    
    /**
     * Cancel request
     */
    static async cancel(id) {
        const sql = "UPDATE requests SET status = 'cancelled' WHERE id = ?";
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
    
    /**
     * Get request counts (for dashboard)
     */
    static async getCounts(userId = null) {
        if (userId) {
            // For specific user (as owner)
            const sql = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned
                FROM requests
                WHERE owner_id = ?
            `;
            const [rows] = await pool.query(sql, [userId]);
            return rows[0];
        } else {
            // For admin (all requests)
            const sql = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned
                FROM requests
            `;
            const [rows] = await pool.query(sql);
            return rows[0];
        }
    }
    
    /**
     * Delete request
     */
    static async delete(id) {
        const sql = 'DELETE FROM requests WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Request;
