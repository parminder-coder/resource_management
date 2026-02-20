/**
 * Resource Controller
 * Handles resource CRUD operations
 */

const Resource = require('../models/Resource');
const Activity = require('../models/Activity');

// @desc    Create a resource
// @route   POST /api/resources
// @access  Private (Authenticated users)
const createResource = async (req, res, next) => {
    try {
        const {
            category_id,
            title,
            description,
            condition,
            location,
            images,
            contact_info
        } = req.body;
        
        // Validation
        if (!category_id || !title) {
            return res.status(400).json({
                success: false,
                message: 'Category and title are required'
            });
        }
        
        // Create resource
        const resourceId = await Resource.create({
            owner_id: req.user.id,
            category_id,
            title,
            description,
            condition,
            location,
            images,
            contact_info
        });
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'resource_created',
            entity_type: 'resource',
            entity_id: resourceId,
            details: { title }
        });
        
        // Get created resource
        const resource = await Resource.findById(resourceId);
        
        res.status(201).json({
            success: true,
            message: 'Resource listed successfully',
            data: { resource }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all resources (with filters)
// @route   GET /api/resources
// @access  Public (verified resources only)
const getResources = async (req, res, next) => {
    try {
        const { search, category, availability, page, limit } = req.query;
        
        const resources = await Resource.findAll({
            search,
            category,
            availability,
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

// @desc    Get my resources
// @route   GET /api/resources/my
// @access  Private
const getMyResources = async (req, res, next) => {
    try {
        const resources = await Resource.findByOwner(req.user.id);
        
        res.json({
            success: true,
            data: { resources }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get available resources (for customers)
// @route   GET /api/resources/available
// @access  Public
const getAvailableResources = async (req, res, next) => {
    try {
        const { search, category, page, limit } = req.query;
        
        const resources = await Resource.findAvailable({
            search,
            category,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 12
        });
        
        res.json({
            success: true,
            data: resources
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
const getResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }
        
        // Increment view count
        await Resource.incrementViewCount(req.params.id);
        
        res.json({
            success: true,
            data: { resource }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Owner only)
const updateResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }
        
        // Check ownership
        if (resource.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own resources'
            });
        }
        
        // Update resource
        await Resource.update(req.params.id, req.body);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'resource_updated',
            entity_type: 'resource',
            entity_id: req.params.id,
            details: { title: resource.title }
        });
        
        // Get updated resource
        const updatedResource = await Resource.findById(req.params.id);
        
        res.json({
            success: true,
            message: 'Resource updated successfully',
            data: { resource: updatedResource }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Owner only)
const deleteResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }
        
        // Check ownership
        if (resource.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own resources'
            });
        }
        
        // Delete resource
        await Resource.delete(req.params.id);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'resource_deleted',
            entity_type: 'resource',
            entity_id: req.params.id,
            details: { title: resource.title }
        });
        
        res.json({
            success: true,
            message: 'Resource deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify/unverify resource (Admin)
// @route   PUT /api/resources/:id/verify
// @access  Private (Admin only)
const verifyResource = async (req, res, next) => {
    try {
        const { is_verified } = req.body;
        
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }
        
        await Resource.update(req.params.id, { is_verified });
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'resource_verified',
            entity_type: 'resource',
            entity_id: req.params.id,
            details: { is_verified }
        });
        
        res.json({
            success: true,
            message: `Resource ${is_verified ? 'verified' : 'unverified'} successfully`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get resource statistics
// @route   GET /api/resources/stats
// @access  Public
const getResourceStats = async (req, res, next) => {
    try {
        const stats = await Resource.getStats();
        const byCategory = await Resource.getByCategory();
        
        res.json({
            success: true,
            data: {
                ...stats,
                by_category: byCategory
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createResource,
    getResources,
    getMyResources,
    getAvailableResources,
    getResource,
    updateResource,
    deleteResource,
    verifyResource,
    getResourceStats
};
