const mongoose = require('mongoose');

const batchPaymentSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
    invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
    totalAmount: { type: Number, default: 0 },
    batchStatus: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' },
    processedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('BatchPayment', batchPaymentSchema);
