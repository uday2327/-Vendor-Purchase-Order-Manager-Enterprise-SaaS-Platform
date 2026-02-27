const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        type: {
            type: String,
            required: true,
            enum: ['late_delivery', 'overdue_invoice', 'overspending', 'budget_exceeded', 'po_approved', 'po_rejected', 'payment_received', 'info'],
        },
        message: {
            type: String,
            required: true,
        },
        relatedEntity: {
            entityType: { type: String, enum: ['Vendor', 'PurchaseOrder', 'Invoice', 'Budget'] },
            entityId: { type: mongoose.Schema.Types.ObjectId },
        },
        read: {
            type: Boolean,
            default: false,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
        },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
