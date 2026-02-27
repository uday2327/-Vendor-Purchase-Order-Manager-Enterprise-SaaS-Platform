const AuditLog = require('../models/AuditLog');

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Get audit logs (admin only)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: entityType
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 */
const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, entityType, action, user: userId } = req.query;
        const filter = {};
        if (entityType) filter.entityType = entityType;
        if (action) filter.action = action;
        if (userId) filter.user = userId;

        const total = await AuditLog.countDocuments(filter);
        const logs = await AuditLog.find(filter)
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json({
            logs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get timeline for a specific entity
const getEntityTimeline = async (req, res) => {
    try {
        const { entityType, id } = req.params;
        const logs = await AuditLog.find({ entityType, entityId: id })
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .lean();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAuditLogs, getEntityTimeline };
