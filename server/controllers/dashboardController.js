const User = require('../models/userModel');
const Resource = require('../models/resourceModel');
const Request = require('../models/requestModel');
const Allocation = require('../models/allocationModel');
const Activity = require('../models/activityModel');

// @desc    Admin dashboard stats
// @route   GET /api/dashboard/admin
const adminDashboard = async (req, res, next) => {
    try {
        const userCounts = await User.getCounts();
        const resourceStats = await Resource.getStats();
        const requestCounts = await Request.getCounts();
        const costOverview = await Resource.getCostOverview();
        const recentActivity = await Activity.getRecent(10);

        res.json({
            users: userCounts,
            resources: resourceStats,
            requests: requestCounts,
            costOverview,
            recentActivity
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Customer dashboard stats
// @route   GET /api/dashboard/customer
const customerDashboard = async (req, res, next) => {
    try {
        const activeResources = await Allocation.countByUser(req.user.id);
        const requestCounts = await Request.getCounts(req.user.id);
        const nearestReturn = await Allocation.nearestReturn(req.user.id);
        const allocations = await Allocation.findByUser(req.user.id);

        res.json({
            activeResources,
            requests: requestCounts,
            nearestReturn,
            allocations
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Admin: manage users CRUD
// @route   GET /api/dashboard/users
const getUsers = async (req, res, next) => {
    try {
        const { search, role, status, page, limit } = req.query;
        const data = await User.findAll({ search, role, status, page: +page || 1, limit: +limit || 10 });
        // Remove passwords
        data.users = data.users.map(u => { delete u.password; return u; });
        res.json(data);
    } catch (err) {
        next(err);
    }
};

// @desc    Admin: create user
// @route   POST /api/dashboard/users
const createUser = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password, role, company, status } = req.body;
        if (!first_name || !last_name || !email || !password) {
            res.status(400);
            throw new Error('All fields required');
        }
        const existing = await User.findByEmail(email);
        if (existing) {
            res.status(400);
            throw new Error('Email already in use');
        }
        const id = await User.create({ first_name, last_name, email, password, role: role || 'customer', company, status });
        const user = await User.findById(id);
        delete user.password;
        await Activity.log({ user_id: req.user.id, action: 'user_created_by_admin', details: `Admin created user: ${first_name} ${last_name}`, entity_type: 'user', entity_id: id });
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

// @desc    Admin: update user
// @route   PUT /api/dashboard/users/:id
const updateUser = async (req, res, next) => {
    try {
        await User.update(req.params.id, req.body);
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        delete user.password;
        res.json(user);
    } catch (err) {
        next(err);
    }
};

// @desc    Admin: delete user
// @route   DELETE /api/dashboard/users/:id
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        await User.delete(req.params.id);
        await Activity.log({ user_id: req.user.id, action: 'user_deleted', details: `Deleted user: ${user.first_name} ${user.last_name}`, entity_type: 'user', entity_id: req.params.id });
        res.json({ message: 'User deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get activity log
// @route   GET /api/dashboard/activity
const getActivity = async (req, res, next) => {
    try {
        const activity = await Activity.getRecent(50);
        res.json(activity);
    } catch (err) {
        next(err);
    }
};

module.exports = { adminDashboard, customerDashboard, getUsers, createUser, updateUser, deleteUser, getActivity };
