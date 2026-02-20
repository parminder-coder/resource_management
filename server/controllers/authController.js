/**
 * Authentication Controller
 * Handles user registration, login, and profile management
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password, phone, department, year_semester } = req.body;
        
        // Validation
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, email, and password are required'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Create user
        const userId = await User.create({
            first_name,
            last_name,
            email,
            password,
            phone,
            department,
            year_semester
        });
        
        // Log activity
        await Activity.log({
            user_id: userId,
            action: 'user_registered',
            entity_type: 'user',
            entity_id: userId,
            details: { email }
        });
        
        // Get created user
        const user = await User.findById(userId);
        
        // Generate token
        const token = generateToken(user);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    department: user.department
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Find user
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check if user is blocked
        if (user.is_blocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact admin.'
            });
        }
        
        // Verify password
        const isPasswordValid = await User.verifyPassword(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Generate token
        const token = generateToken(user);
        
        // Log activity
        await Activity.log({
            user_id: user.id,
            action: 'user_login',
            entity_type: 'user',
            entity_id: user.id,
            details: { email }
        });
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    year_semester: user.year_semester
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { phone, department, year_semester, wallet_address } = req.body;
        
        const updated = await User.update(req.user.id, {
            phone,
            department,
            year_semester,
            wallet_address
        });
        
        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'profile_updated',
            entity_type: 'user',
            entity_id: req.user.id,
            details: { phone, department, year_semester, wallet_address }
        });
        
        const user = await User.findById(req.user.id);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }
        
        // Get current user
        const user = await User.findByEmail(req.user.email);
        
        // Verify current password
        const isPasswordValid = await User.verifyPassword(currentPassword, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Change password
        await User.changePassword(req.user.id, newPassword);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'password_changed',
            entity_type: 'user',
            entity_id: req.user.id
        });
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};
