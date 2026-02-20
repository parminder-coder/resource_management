/**
 * Admin Controller
 * Handles admin-specific operations
 */

const User = require('../models/User');
const Resource = require('../models/Resource');
const Request = require('../models/Request');
const Activity = require('../models/Activity');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getStats = async (req, res, next) => {
    try {
        // Get counts
        const resourceStats = await Resource.getStats();
        const requestCounts = await Request.getCounts();

        // Get user counts
        const usersData = await User.findAll({ limit: 1 });
        const totalUsers = usersData.total || 0;

        // Get recent activity
        const recentActivity = await Activity.getRecent(10);

        // Get category distribution
        const categoryDistribution = await Resource.getByCategory();

        res.json({
            success: true,
            data: {
                resources: resourceStats,
                requests: requestCounts,
                users: { total: totalUsers },
                recent_activity: recentActivity,
                categories: categoryDistribution
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = async (req, res, next) => {
    try {
        const { page, limit, search, role } = req.query;
        
        const users = await User.findAll({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            search,
            role
        });
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify user
// @route   PUT /api/admin/users/:id/verify
// @access  Private (Admin only)
const verifyUser = async (req, res, next) => {
    try {
        const { is_verified } = req.body;
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        await User.setVerified(req.params.id, is_verified);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'user_verified',
            entity_type: 'user',
            entity_id: req.params.id,
            details: { is_verified }
        });
        
        res.json({
            success: true,
            message: `User ${is_verified ? 'verified' : 'unverified'} successfully`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin only)
const blockUser = async (req, res, next) => {
    try {
        const { is_blocked } = req.body;
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        await User.setBlocked(req.params.id, is_blocked);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'user_blocked',
            entity_type: 'user',
            entity_id: req.params.id,
            details: { is_blocked }
        });
        
        res.json({
            success: true,
            message: `User ${is_blocked ? 'blocked' : 'unblocked'} successfully`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Prevent admin from deleting themselves
        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }
        
        await User.delete(req.params.id);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'user_deleted',
            entity_type: 'user',
            entity_id: req.params.id
        });
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get activity log
// @route   GET /api/admin/activity
// @access  Private (Admin only)
const getActivity = async (req, res, next) => {
    try {
        const { page, limit, userId, action } = req.query;
        
        const activities = await Activity.findAll({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            userId,
            action
        });
        
        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all resources (admin view)
// @route   GET /api/admin/resources
// @access  Private (Admin only)
const getResources = async (req, res, next) => {
    try {
        const { search, category, is_verified, page, limit } = req.query;
        
        const resources = await Resource.findAll({
            search,
            category,
            is_verified: is_verified !== undefined ? is_verified === 'true' : null,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10
        });
        
        res.json({
            success: true,
            data: resources
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getUsers,
    verifyUser,
    blockUser,
    deleteUser,
    getActivity,
    getResources
};
