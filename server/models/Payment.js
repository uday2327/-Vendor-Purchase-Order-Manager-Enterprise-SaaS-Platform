const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: ['Card', 'UPI', 'Bank Transfer', 'Manual'], default: 'Manual' },
    transactionId: { type: String, trim: true },
    paymentGateway: { type: String, enum: ['Stripe', 'Razorpay', 'Manual'], default: 'Manual' },
    paymentStatus: { type: String, enum: ['Pending', 'Success', 'Failed', 'Refunded'], default: 'Pending' },
    paymentApprovalStatus: { type: String, enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'N/A'], default: 'N/A' },
    scheduledDate: { type: Date, default: null },
    paidAt: { type: Date },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
    discountApplied: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    approvalHistory: [{
        action: { type: String, enum: ['Submitted', 'Approved', 'Rejected'] },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        comment: { type: String, default: '' },
    }],
    // Multi-currency
    currency: { type: String, default: 'INR', trim: true },
    exchangeRate: { type: Number, default: 1 },
    baseCurrencyAmount: { type: Number, default: 0 },
    // Retry & idempotency
    retryCount: { type: Number, default: 0 },
    lastRetryAt: { type: Date },
    idempotencyKey: { type: String, sparse: true },
    // Soft delete
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

paymentSchema.pre('save', function (next) {
    if (!this.transactionId && this.isNew) {
        this.transactionId = 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    }
    next();
});

paymentSchema.index({ invoice: 1 });
paymentSchema.index({ vendor: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ scheduledDate: 1, paymentStatus: 1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
