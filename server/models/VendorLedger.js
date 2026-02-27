const mongoose = require('mongoose');

const vendorLedgerSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, unique: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    totalInvoiced: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalOutstanding: { type: Number, default: 0 },
    creditBalance: { type: Number, default: 0 },
    debitBalance: { type: Number, default: 0 },
    totalDiscounts: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    entries: [{
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['Invoice', 'Payment', 'Credit', 'Debit'] },
        description: { type: String },
        amount: { type: Number },
        balance: { type: Number },
        referenceId: { type: mongoose.Schema.Types.ObjectId },
    }],
}, { timestamps: true });

vendorLedgerSchema.index({ vendor: 1 });

module.exports = mongoose.model('VendorLedger', vendorLedgerSchema);
