/**
 * Request Routes
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createRequest,
    getSentRequests,
    getReceivedRequests,
    getAllRequests,
    getRequestCounts,
    approveRequest,
    rejectRequest,
    returnResource,
    cancelRequest,
    deleteRequest
} = require('../controllers/requestController');

// Protected routes
router.post('/', auth, createRequest);
router.get('/sent', auth, getSentRequests);
router.get('/received', auth, getReceivedRequests);
router.get('/', auth, getAllRequests);
router.get('/counts', auth, getRequestCounts);
router.put('/:id/approve', auth, approveRequest);
router.put('/:id/reject', auth, rejectRequest);
router.put('/:id/return', auth, returnResource);
router.delete('/:id/cancel', auth, cancelRequest);
router.delete('/:id', auth, deleteRequest);

module.exports = router;
