/**
 * Resource Model
 * Handles all resource-related database operations
 */

const { pool } = require('../config/database');

class Resource {
    /**
     * Create a new resource
     */
    static async create(resourceData) {
        const {
            owner_id,
            category_id,
            title,
            description,
            condition,
            location,
            images,
            contact_info
        } = resourceData;
        
        const sql = `
            INSERT INTO resources (owner_id, category_id, title, description, condition, location, images, contact_info)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const imagesJson = images ? JSON.stringify(images) : null;
        
        const [result] = await pool.query(sql, [
            owner_id,
            category_id,
            title,
            description,
            condition || 'good',
            location,
            imagesJson,
            contact_info
        ]);
        
        return result.insertId;
    }
    
    /**
     * Find resource by ID
     */
    static async findById(id) {
        const sql = `
            SELECT r.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
                   u.first_name, u.last_name, u.email as owner_email, u.phone as owner_phone,
                   u.department as owner_department
            FROM resources r
            JOIN categories c ON r.category_id = c.id
            JOIN users u ON r.owner_id = u.id
            WHERE r.id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        return rows[0] || null;
    }
    
    /**
     * Get all resources with filters
     */
    static async findAll({ search = '', category = '', availability = '', is_verified = true, page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        
        let sql = `
            SELECT r.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
                   u.first_name as owner_first_name, u.last_name as owner_last_name, u.email as owner_email
            FROM resources r
            JOIN categories c ON r.category_id = c.id
            JOIN users u ON r.owner_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (is_verified !== null) {
            sql += ` AND r.is_verified = ?`;
            params.push(is_verified ? 1 : 0);
        }
        
        if (search) {
            sql += ` AND (r.title LIKE ? OR r.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (category) {
            sql += ` AND c.slug = ?`;
            params.push(category);
        }
        
        if (availability) {
            sql += ` AND r.availability = ?`;
            params.push(availability);
        }
        
        sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const [rows] = await pool.query(sql, params);
        
        // Parse images JSON
        rows.forEach(row => {
            if (row.images) {
                try {
                    row.images = JSON.parse(row.images);
                } catch (e) {
                    row.images = [];
                }
            }
        });
        
        // Get total count
        let countSql = `
            SELECT COUNT(*) as total FROM resources r
            JOIN categories c ON r.category_id = c.id
            WHERE 1=1
        `;
        const countParams = [];
        
        if (is_verified !== null) {
            countSql += ` AND r.is_verified = ?`;
            countParams.push(is_verified ? 1 : 0);
        }
        
        if (search) {
            countSql += ` AND (r.title LIKE ? OR r.description LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }
        
        if (category) {
            countSql += ` AND c.slug = ?`;
            countParams.push(category);
        }
        
        if (availability) {
            countSql += ` AND r.availability = ?`;
            countParams.push(availability);
        }
        
        const [{ total }] = await pool.query(countSql, countParams);
        
        return {
            resources: rows,
            total: Number(total),
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        };
    }
    
    /**
     * Get resources by owner
     */
    static async findByOwner(ownerId) {
        const sql = `
            SELECT r.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
            FROM resources r
            JOIN categories c ON r.category_id = c.id
            WHERE r.owner_id = ?
            ORDER BY r.created_at DESC
        `;
        const [rows] = await pool.query(sql, [ownerId]);
        
        rows.forEach(row => {
            if (row.images) {
                try {
                    row.images = JSON.parse(row.images);
                } catch (e) {
                    row.images = [];
                }
            }
        });
        
        return rows;
    }
    
    /**
     * Update resource
     */
    static async update(id, resourceData) {
        const allowedFields = ['title', 'description', 'condition', 'availability', 'location', 'images', 'contact_info', 'is_verified'];
        const updates = [];
        const values = [];
        
        for (const [key, value] of Object.entries(resourceData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(key === 'images' ? JSON.stringify(value) : value);
            }
        }
        
        if (updates.length === 0) return false;
        
        values.push(id);
        const sql = `UPDATE resources SET ${updates.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(sql, values);
        
        return result.affectedRows > 0;
    }
    
    /**
     * Delete resource
     */
    static async delete(id) {
        const sql = 'DELETE FROM resources WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
    
    /**
     * Increment view count
     */
    static async incrementViewCount(id) {
        const sql = 'UPDATE resources SET view_count = view_count + 1 WHERE id = ?';
        await pool.query(sql, [id]);
    }
    
    /**
     * Get available resources (for customers)
     */
    static async findAvailable({ search = '', category = '', page = 1, limit = 12 } = {}) {
        return this.findAll({
            search,
            category,
            availability: 'available',
            is_verified: true,
            page,
            limit
        });
    }
    
    /**
     * Get statistics
     */
    static async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_resources,
                SUM(CASE WHEN availability = 'available' THEN 1 ELSE 0 END) as available_count,
                SUM(CASE WHEN availability = 'unavailable' THEN 1 ELSE 0 END) as unavailable_count,
                COUNT(DISTINCT owner_id) as total_owners
            FROM resources
            WHERE is_verified = TRUE
        `;
        const [rows] = await pool.query(sql);
        return rows[0];
    }
    
    /**
     * Get resources by category
     */
    static async getByCategory() {
        const sql = `
            SELECT c.name, c.slug, COUNT(r.id) as count
            FROM categories c
            LEFT JOIN resources r ON c.id = r.category_id AND r.is_verified = TRUE
            GROUP BY c.id, c.name, c.slug
            ORDER BY count DESC
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }
}

module.exports = Resource;
