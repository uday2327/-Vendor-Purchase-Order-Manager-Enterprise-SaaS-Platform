const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// @desc Generate compliance report from audit logs
const getComplianceReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(to);

        const matchStage = {};
        if (Object.keys(dateFilter).length) matchStage.createdAt = dateFilter;

        // Activity summary by user
        const userActivity = await AuditLog.aggregate([
            { $match: matchStage },
            { $group: { _id: '$user', actionCount: { $sum: 1 }, actions: { $addToSet: '$action' } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
            { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
            { $project: { userName: '$userInfo.name', email: '$userInfo.email', role: '$userInfo.role', actionCount: 1, actions: 1 } },
            { $sort: { actionCount: -1 } },
        ]);

        // Action breakdown
        const actionBreakdown = await AuditLog.aggregate([
            { $match: matchStage },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Entity breakdown
        const entityBreakdown = await AuditLog.aggregate([
            { $match: matchStage },
            { $group: { _id: '$entityType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Suspicious activity (deletes, off-hours activity)
        const deletes = await AuditLog.countDocuments({ ...matchStage, action: 'DELETE' });
        const totalLogs = await AuditLog.countDocuments(matchStage);

        // Users with password
        const totalUsers = await User.countDocuments();
        const users2FA = await User.countDocuments({ enable2FA: true });

        res.json({
            period: { from: from || 'All time', to: to || 'Now' },
            summary: { totalEvents: totalLogs, deleteEvents: deletes, uniqueUsers: userActivity.length },
            security: { totalUsers, users2FAEnabled: users2FA, twoFactorCoverage: totalUsers > 0 ? ((users2FA / totalUsers) * 100).toFixed(1) + '%' : '0%' },
            userActivity,
            actionBreakdown: actionBreakdown.map(a => ({ action: a._id, count: a.count })),
            entityBreakdown: entityBreakdown.map(e => ({ entity: e._id, count: e.count })),
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getComplianceReport };
