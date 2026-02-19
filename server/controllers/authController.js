const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const Activity = require('../models/activityModel');

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password, company, role } = req.body;

        if (!first_name || !last_name || !email || !password) {
            res.status(400);
            throw new Error('Please fill all required fields');
        }

        const existing = await User.findByEmail(email);
        if (existing) {
            res.status(400);
            throw new Error('User already exists with this email');
        }

        const userId = await User.create({
            first_name,
            last_name,
            email,
            password,
            company: company || '',
            role: role || 'customer'
        });

        const user = await User.findById(userId);
        await Activity.log({ user_id: userId, action: 'user_registered', details: `${first_name} ${last_name} registered`, entity_type: 'user', entity_id: userId });

        res.status(201).json({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            token: generateToken(user)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Email and password are required');
        }

        const user = await User.findByEmail(email);
        if (!user) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        const isMatch = await User.matchPassword(password, user.password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        if (user.status !== 'active') {
            res.status(403);
            throw new Error('Account is inactive. Contact admin.');
        }

        // If role specified in login, verify it matches
        if (role && role !== user.role) {
            res.status(403);
            throw new Error(`You are not registered as ${role}. Your role is ${user.role}.`);
        }

        await Activity.log({ user_id: user.id, action: 'user_login', details: `${user.first_name} ${user.last_name} logged in`, entity_type: 'user', entity_id: user.id });

        res.json({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            company: user.company,
            token: generateToken(user)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
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

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
    try {
        const { first_name, last_name, company, email } = req.body;
        await User.update(req.user.id, { first_name, last_name, company, email });
        const user = await User.findById(req.user.id);
        delete user.password;
        res.json(user);
    } catch (err) {
        next(err);
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByEmail(req.user.email);

        const isMatch = await User.matchPassword(currentPassword, user.password);
        if (!isMatch) {
            res.status(400);
            throw new Error('Current password is incorrect');
        }

        await User.update(user.id, { password: newPassword });
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
