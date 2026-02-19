const Allocation = require('../models/allocationModel');
const Activity = require('../models/activityModel');

// @desc    Get my allocations (customer)
// @route   GET /api/allocations/mine
const getMyAllocations = async (req, res, next) => {
    try {
        const allocations = await Allocation.findByUser(req.user.id);
        res.json(allocations);
    } catch (err) {
        next(err);
    }
};

// @desc    Get all allocations (admin)
// @route   GET /api/allocations
const getAllAllocations = async (req, res, next) => {
    try {
        const allocations = await Allocation.findAll();
        res.json(allocations);
    } catch (err) {
        next(err);
    }
};

// @desc    Return a resource
// @route   PUT /api/allocations/:id/return
const returnResource = async (req, res, next) => {
    try {
        const result = await Allocation.returnResource(req.params.id, req.user.id);
        if (!result) {
            res.status(404);
            throw new Error('Allocation not found or not yours');
        }
        await Activity.log({ user_id: req.user.id, action: 'resource_returned', details: `Returned resource allocation #${req.params.id}`, entity_type: 'allocation', entity_id: req.params.id });
        res.json({ message: 'Resource returned successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getMyAllocations, getAllAllocations, returnResource };
