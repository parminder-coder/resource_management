const express = require('express');
const router = express.Router();
const { createResource, getResources, getAvailableResources, getResource, updateResource, deleteResource, getResourceStats, getCostOverview } = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/available', protect, getAvailableResources);
router.get('/stats', protect, authorize('admin'), getResourceStats);
router.get('/cost-overview', protect, authorize('admin'), getCostOverview);
router.route('/')
    .get(protect, getResources)
    .post(protect, authorize('admin'), createResource);
router.route('/:id')
    .get(protect, getResource)
    .put(protect, authorize('admin'), updateResource)
    .delete(protect, authorize('admin'), deleteResource);

module.exports = router;
