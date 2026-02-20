/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Protected routes (admin only would be added if needed)
// router.post('/', auth, adminOnly, createCategory);

module.exports = router;
