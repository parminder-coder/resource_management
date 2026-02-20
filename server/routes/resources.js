/**
 * Resource Routes
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createResource,
    getResources,
    getMyResources,
    getAvailableResources,
    getResource,
    updateResource,
    deleteResource,
    verifyResource,
    getResourceStats
} = require('../controllers/resourceController');

// Public routes
router.get('/', getResources);
router.get('/available', getAvailableResources);
router.get('/:id', getResource);
router.get('/stats', getResourceStats);

// Protected routes
router.post('/', auth, createResource);
router.get('/my', auth, getMyResources);
router.put('/:id', auth, updateResource);
router.delete('/:id', auth, deleteResource);
router.put('/:id/verify', auth, verifyResource);

module.exports = router;
