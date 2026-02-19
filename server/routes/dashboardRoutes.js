const express = require('express');
const router = express.Router();
const { adminDashboard, customerDashboard, getUsers, createUser, updateUser, deleteUser, getActivity } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/admin', protect, authorize('admin'), adminDashboard);
router.get('/customer', protect, customerDashboard);
router.get('/activity', protect, authorize('admin'), getActivity);
router.route('/users')
    .get(protect, authorize('admin'), getUsers)
    .post(protect, authorize('admin'), createUser);
router.route('/users/:id')
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
