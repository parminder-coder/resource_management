/**
 * Request Controller
 * Handles resource request workflow
 */

const Request = require('../models/Request');
const Resource = require('../models/Resource');
const Activity = require('../models/Activity');

// @desc    Create a request
// @route   POST /api/requests
// @access  Private (Authenticated users)
const createRequest = async (req, res, next) => {
    try {
        const { resource_id, message, duration } = req.body;
        
        // Validation
        if (!resource_id) {
            return res.status(400).json({
                success: false,
                message: 'Resource ID is required'
            });
        }
        
        // Get resource to find owner
        const resource = await Resource.findById(resource_id);
        
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }
        
        // Check if user is trying to request their own resource
        if (resource.owner_id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot request your own resource'
            });
        }
        
        // Check if resource is available
        if (resource.availability !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'This resource is currently not available'
            });
        }
        
        // Check for existing pending request
        const existingRequests = await Request.findAll({ 
            status: 'pending' 
        });
        
        const hasPending = existingRequests.requests.some(
            r => r.resource_id === resource_id && r.requester_id === req.user.id
        );
        
        if (hasPending) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request for this resource'
            });
        }
        
        // Create request
        const requestId = await Request.create({
            resource_id,
            requester_id: req.user.id,
            owner_id: resource.owner_id,
            message,
            duration
        });
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'request_created',
            entity_type: 'request',
            entity_id: requestId,
            details: { resource_id, resource_title: resource.title }
        });
        
        // Get created request
        const request = await Request.findById(requestId);
        
        res.status(201).json({
            success: true,
            message: 'Request sent successfully',
            data: { request }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get requests sent by user
// @route   GET /api/requests/sent
// @access  Private
const getSentRequests = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        
        const requests = await Request.findByRequester(req.user.id, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10
        });
        
        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get requests received by user (as owner)
// @route   GET /api/requests/received
// @access  Private
const getReceivedRequests = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        
        const requests = await Request.findByOwner(req.user.id, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10
        });
        
        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all requests (Admin)
// @route   GET /api/requests
// @access  Private (Admin only)
const getAllRequests = async (req, res, next) => {
    try {
        const { status, page, limit } = req.query;
        
        const requests = await Request.findAll({
            status,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });
        
        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get request counts
// @route   GET /api/requests/counts
// @access  Private
const getRequestCounts = async (req, res, next) => {
    try {
        const { asRequester } = req.query;
        
        const counts = await Request.getCounts(
            req.user.role === 'admin' ? null : req.user.id,
            asRequester === 'true'
        );

        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve request (Owner or Admin)
// @route   PUT /api/requests/:id/approve
// @access  Private
const approveRequest = async (req, res, next) => {
    try {
        const { admin_note } = req.body;
        
        const request = await Request.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        // Check if user is owner or admin
        if (request.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only approve requests for your own resources'
            });
        }
        
        // Approve request
        await Request.approve(req.params.id, admin_note);
        
        // Update resource availability
        await Resource.update(request.resource_id, {
            availability: 'unavailable'
        });
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'request_approved',
            entity_type: 'request',
            entity_id: req.params.id,
            details: { resource_id: request.resource_id }
        });
        
        res.json({
            success: true,
            message: 'Request approved successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject request (Owner or Admin)
// @route   PUT /api/requests/:id/reject
// @access  Private
const rejectRequest = async (req, res, next) => {
    try {
        const { admin_note } = req.body;
        
        const request = await Request.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        // Check if user is owner or admin
        if (request.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only reject requests for your own resources'
            });
        }
        
        // Reject request
        await Request.reject(req.params.id, admin_note);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'request_rejected',
            entity_type: 'request',
            entity_id: req.params.id,
            details: { resource_id: request.resource_id }
        });
        
        res.json({
            success: true,
            message: 'Request rejected'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark request as returned
// @route   PUT /api/requests/:id/return
// @access  Private
const returnResource = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        // Check if user is requester or admin
        if (request.requester_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only mark your own returns'
            });
        }
        
        // Mark as returned
        await Request.markReturned(req.params.id);
        
        // Update resource availability
        await Resource.update(request.resource_id, {
            availability: 'available'
        });
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'resource_returned',
            entity_type: 'request',
            entity_id: req.params.id,
            details: { resource_id: request.resource_id }
        });
        
        res.json({
            success: true,
            message: 'Resource marked as returned'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel request
// @route   DELETE /api/requests/:id/cancel
// @access  Private
const cancelRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        // Check if user is requester or admin
        if (request.requester_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own requests'
            });
        }
        
        // Cancel request
        await Request.cancel(req.params.id);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'request_cancelled',
            entity_type: 'request',
            entity_id: req.params.id,
            details: { resource_id: request.resource_id }
        });
        
        res.json({
            success: true,
            message: 'Request cancelled'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private (Admin only)
const deleteRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        // Delete request
        await Request.delete(req.params.id);
        
        // Log activity
        await Activity.log({
            user_id: req.user.id,
            action: 'request_deleted',
            entity_type: 'request',
            entity_id: req.params.id
        });
        
        res.json({
            success: true,
            message: 'Request deleted'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};
