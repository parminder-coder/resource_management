const Resource = require('../models/resourceModel');
const Activity = require('../models/activityModel');

// @desc    Create resource (admin)
// @route   POST /api/resources
const createResource = async (req, res, next) => {
    try {
        const { name, category, description, cost, total_qty, status } = req.body;
        if (!name || !category) {
            res.status(400);
            throw new Error('Name and category are required');
        }
        const id = await Resource.create({ name, category, description, status, quantity: total_qty || 1, cost_per_unit: cost || 0 });
        const resource = await Resource.findById(id);
        await Activity.log({ user_id: req.user.id, action: 'resource_created', details: `Created resource: ${name}`, entity_type: 'resource', entity_id: id });
        res.status(201).json(resource);
    } catch (err) {
        next(err);
    }
};

// @desc    Get all resources
// @route   GET /api/resources
const getResources = async (req, res, next) => {
    try {
        const { search, category, status, page, limit } = req.query;
        const data = await Resource.findAll({ search, category, status, page: +page || 1, limit: +limit || 10 });
        res.json(data);
    } catch (err) {
        next(err);
    }
};

// @desc    Get available resources (customer)
// @route   GET /api/resources/available
const getAvailableResources = async (req, res, next) => {
    try {
        const { search, category } = req.query;
        const resources = await Resource.findAvailable(search, category);
        res.json(resources);
    } catch (err) {
        next(err);
    }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
const getResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            res.status(404);
            throw new Error('Resource not found');
        }
        res.json(resource);
    } catch (err) {
        next(err);
    }
};

// @desc    Update resource (admin)
// @route   PUT /api/resources/:id
const updateResource = async (req, res, next) => {
    try {
        const existing = await Resource.findById(req.params.id);
        if (!existing) {
            res.status(404);
            throw new Error('Resource not found');
        }
        await Resource.update(req.params.id, req.body);
        const updated = await Resource.findById(req.params.id);
        await Activity.log({ user_id: req.user.id, action: 'resource_updated', details: `Updated resource: ${updated.name}`, entity_type: 'resource', entity_id: req.params.id });
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

// @desc    Delete resource (admin)
// @route   DELETE /api/resources/:id
const deleteResource = async (req, res, next) => {
    try {
        const existing = await Resource.findById(req.params.id);
        if (!existing) {
            res.status(404);
            throw new Error('Resource not found');
        }
        await Resource.delete(req.params.id);
        await Activity.log({ user_id: req.user.id, action: 'resource_deleted', details: `Deleted resource: ${existing.name}`, entity_type: 'resource', entity_id: req.params.id });
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get resource stats (admin)
// @route   GET /api/resources/stats
const getResourceStats = async (req, res, next) => {
    try {
        const stats = await Resource.getStats();
        res.json(stats);
    } catch (err) {
        next(err);
    }
};

// @desc    Get cost overview (admin)
// @route   GET /api/resources/cost-overview
const getCostOverview = async (req, res, next) => {
    try {
        const data = await Resource.getCostOverview();
        res.json(data);
    } catch (err) {
        next(err);
    }
};

module.exports = { createResource, getResources, getAvailableResources, getResource, updateResource, deleteResource, getResourceStats, getCostOverview };
