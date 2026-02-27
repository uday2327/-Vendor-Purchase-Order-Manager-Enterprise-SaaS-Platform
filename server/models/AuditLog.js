const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'PAYMENT', 'DELIVERY', 'UPLOAD', 'IMPORT', 'AUTO_GENERATE'],
        },
        entityType: {
            type: String,
            required: true,
            enum: ['Vendor', 'PurchaseOrder', 'Invoice', 'User', 'Budget', 'Notification'],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
        },
    },
    { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ organizationId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
