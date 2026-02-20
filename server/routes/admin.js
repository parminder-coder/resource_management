/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
    getStats,
    getUsers,
    verifyUser,
    blockUser,
    deleteUser,
    getActivity,
    getResources
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(auth, roleCheck('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/verify', verifyUser);
router.put('/users/:id/block', blockUser);
router.delete('/users/:id', deleteUser);
router.get('/activity', getActivity);
router.get('/resources', getResources);

module.exports = router;
