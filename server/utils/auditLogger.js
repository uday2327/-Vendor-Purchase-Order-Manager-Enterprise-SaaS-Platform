const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event
 * @param {string} userId - User performing the action
 * @param {string} action - CREATE|UPDATE|DELETE|APPROVE|REJECT|SUBMIT|PAYMENT|DELIVERY|UPLOAD|IMPORT|AUTO_GENERATE
 * @param {string} entityType - Vendor|PurchaseOrder|Invoice|User|Budget|Notification
 * @param {string} entityId - ID of the affected entity
 * @param {object} metadata - Additional data about the action
 * @param {string} organizationId - Organization scope
 */
const logAudit = async (userId, action, entityType, entityId, metadata = {}, organizationId = null) => {
    try {
        await AuditLog.create({
            user: userId,
            action,
            entityType,
            entityId,
            metadata,
            organizationId,
        });
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
};

module.exports = { logAudit };
