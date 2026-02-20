/**
 * Category Controller
 * Handles category operations
 */

const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.findAll();
        
        res.json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            data: { category }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin only)
const createCategory = async (req, res, next) => {
    try {
        const { name, slug, icon, description } = req.body;
        
        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: 'Name and slug are required'
            });
        }
        
        const categoryId = await Category.create({ name, slug, icon, description });
        const category = await Category.findById(categoryId);
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
const updateCategory = async (req, res, next) => {
    try {
        const { name, slug, icon, description } = req.body;
        
        const updated = await Category.update(req.params.id, { name, slug, icon, description });
        
        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update category'
            });
        }
        
        const category = await Category.findById(req.params.id);
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: { category }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res, next) => {
    try {
        const deleted = await Category.delete(req.params.id);
        
        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: 'Failed to delete category'
            });
        }
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
