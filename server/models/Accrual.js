const mongoose = require('mongoose');

const accrualSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    referenceType: { type: String, enum: ['PurchaseOrder', 'Contract'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    description: { type: String, default: '' },
    estimatedAmount: { type: Number, required: true, min: 0 },
    expenseAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    accrualDate: { type: Date, default: Date.now },
    reversalDate: { type: Date },
    status: { type: String, enum: ['Active', 'Reversed', 'Matched'], default: 'Active' },
    matchedInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    journalEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
    reversalJournalId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

accrualSchema.index({ status: 1, referenceType: 1 });

module.exports = mongoose.model('Accrual', accrualSchema);
