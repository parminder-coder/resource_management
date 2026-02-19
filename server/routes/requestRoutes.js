const express = require('express');
const router = express.Router();
const { createRequest, getRequests, getMyRequests, approveRequest, rejectRequest, cancelRequest, getRequestCounts } = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/mine', protect, getMyRequests);
router.get('/counts', protect, getRequestCounts);
router.route('/')
    .get(protect, authorize('admin'), getRequests)
    .post(protect, createRequest);
router.put('/:id/approve', protect, authorize('admin'), approveRequest);
router.put('/:id/reject', protect, authorize('admin'), rejectRequest);
router.delete('/:id', protect, cancelRequest);

module.exports = router;
