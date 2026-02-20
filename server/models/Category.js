/**
 * Category Model
 * Handles category-related database operations
 */

const { pool } = require('../config/database');

class Category {
    /**
     * Get all categories
     */
    static async findAll() {
        const sql = `
            SELECT c.*, COUNT(r.id) as resource_count
            FROM categories c
            LEFT JOIN resources r ON c.id = r.category_id AND r.is_verified = TRUE
            GROUP BY c.id, c.name, c.slug, c.icon, c.description
            ORDER BY c.name
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }
    
    /**
     * Find category by ID
     */
    static async findById(id) {
        const sql = 'SELECT * FROM categories WHERE id = ?';
        const [rows] = await pool.query(sql, [id]);
        return rows[0] || null;
    }
    
    /**
     * Find category by slug
     */
    static async findBySlug(slug) {
        const sql = 'SELECT * FROM categories WHERE slug = ?';
        const [rows] = await pool.query(sql, [slug]);
        return rows[0] || null;
    }
    
    /**
     * Create category (admin)
     */
    static async create(categoryData) {
        const { name, slug, icon, description } = categoryData;
        
        const sql = `
            INSERT INTO categories (name, slug, icon, description)
            VALUES (?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(sql, [name, slug, icon, description]);
        return result.insertId;
    }
    
    /**
     * Update category (admin)
     */
    static async update(id, categoryData) {
        const { name, slug, icon, description } = categoryData;
        
        const sql = `
            UPDATE categories 
            SET name = ?, slug = ?, icon = ?, description = ?
            WHERE id = ?
        `;
        
        const [result] = await pool.query(sql, [name, slug, icon, description, id]);
        return result.affectedRows > 0;
    }
    
    /**
     * Delete category (admin)
     */
    static async delete(id) {
        const sql = 'DELETE FROM categories WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Category;
