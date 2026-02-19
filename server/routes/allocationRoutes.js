const express = require('express');
const router = express.Router();
const { getMyAllocations, getAllAllocations, returnResource } = require('../controllers/allocationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/mine', protect, getMyAllocations);
router.get('/', protect, authorize('admin'), getAllAllocations);
router.put('/:id/return', protect, returnResource);

module.exports = router;
