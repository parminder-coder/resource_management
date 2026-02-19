const Request = require('../models/requestModel');
const Resource = require('../models/resourceModel');
const Allocation = require('../models/allocationModel');
const Activity = require('../models/activityModel');

// @desc    Create a resource request (customer)
// @route   POST /api/requests
const createRequest = async (req, res, next) => {
    try {
        const { resource_id, reason, priority, needed_by } = req.body;
        if (!resource_id || !reason) {
            res.status(400);
            throw new Error('Resource ID and reason are required');
        }
        const resource = await Resource.findById(resource_id);
        if (!resource || resource.available_qty < 1) {
            res.status(400);
            throw new Error('Resource is not available');
        }
        const id = await Request.create({ user_id: req.user.id, resource_id, reason, priority, needed_by });
        const request = await Request.findById(id);
        await Activity.log({ user_id: req.user.id, action: 'request_created', details: `Requested: ${resource.name}`, entity_type: 'request', entity_id: id });
        res.status(201).json(request);
    } catch (err) {
        next(err);
    }
};

// @desc    Get all requests (admin)
// @route   GET /api/requests
const getRequests = async (req, res, next) => {
    try {
        const { status, page, limit } = req.query;
        const data = await Request.findAll({ status, page: +page || 1, limit: +limit || 10 });
        res.json(data);
    } catch (err) {
        next(err);
    }
};

// @desc    Get my requests (customer)
// @route   GET /api/requests/mine
const getMyRequests = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const data = await Request.findByUser(req.user.id, { page: +page || 1, limit: +limit || 10 });
        res.json(data);
    } catch (err) {
        next(err);
    }
};

// @desc    Approve request (admin)
// @route   PUT /api/requests/:id/approve
const approveRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            throw new Error('Request not found');
        }
        if (request.status !== 'pending') {
            res.status(400);
            throw new Error('Request is not pending');
        }

        const resource = await Resource.findById(request.resource_id);
        if (!resource || resource.available_qty < 1) {
            res.status(400);
            throw new Error('Resource no longer available');
        }

        // Approve the request
        await Request.approve(req.params.id, req.user.id, req.body.admin_note);

        // Allocate the resource
        const returnDue = new Date();
        returnDue.setDate(returnDue.getDate() + 30); // default 30 day allocation
        await Allocation.create({
            user_id: request.user_id,
            resource_id: request.resource_id,
            request_id: request.id,
            return_due: returnDue.toISOString().split('T')[0]
        });

        // Decrease available qty, update resource status
        await Resource.update(request.resource_id, {
            available_qty: resource.available_qty - 1,
            status: resource.available_qty - 1 <= 0 ? 'in-use' : resource.status,
            assigned_to: request.user_id
        });

        await Activity.log({ user_id: req.user.id, action: 'request_approved', details: `Approved request for ${resource.name} by user ${request.user_name}`, entity_type: 'request', entity_id: req.params.id });

        const updated = await Request.findById(req.params.id);
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

// @desc    Reject request (admin)
// @route   PUT /api/requests/:id/reject
const rejectRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            throw new Error('Request not found');
        }
        if (request.status !== 'pending') {
            res.status(400);
            throw new Error('Request is not pending');
        }

        await Request.reject(req.params.id, req.user.id, req.body.admin_note);
        await Activity.log({ user_id: req.user.id, action: 'request_rejected', details: `Rejected request for ${request.resource_name}`, entity_type: 'request', entity_id: req.params.id });

        const updated = await Request.findById(req.params.id);
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

// @desc    Cancel request (customer)
// @route   DELETE /api/requests/:id
const cancelRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            throw new Error('Request not found');
        }
        if (request.user_id !== req.user.id) {
            res.status(403);
            throw new Error('Not authorized to cancel this request');
        }
        if (request.status !== 'pending') {
            res.status(400);
            throw new Error('Can only cancel pending requests');
        }
        await Request.cancel(req.params.id);
        res.json({ message: 'Request cancelled' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get request counts
// @route   GET /api/requests/counts
const getRequestCounts = async (req, res, next) => {
    try {
        const userId = req.user.role === 'customer' ? req.user.id : null;
        const counts = await Request.getCounts(userId);
        res.json(counts);
    } catch (err) {
        next(err);
    }
};

module.exports = { createRequest, getRequests, getMyRequests, approveRequest, rejectRequest, cancelRequest, getRequestCounts };
