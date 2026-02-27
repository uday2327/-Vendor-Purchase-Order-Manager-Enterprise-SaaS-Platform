const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    referenceType: { type: String, enum: ['Invoice', 'Payment', 'Adjustment', 'Accrual', 'Batch'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    description: { type: String, default: '' },
    entries: [{
        account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
        accountName: { type: String },
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
    }],
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    isBalanced: { type: Boolean, default: true },
    periodMonth: { type: Number },
    periodYear: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

journalEntrySchema.pre('save', function (next) {
    this.totalDebit = this.entries.reduce((s, e) => s + (e.debit || 0), 0);
    this.totalCredit = this.entries.reduce((s, e) => s + (e.credit || 0), 0);
    this.isBalanced = Math.abs(this.totalDebit - this.totalCredit) < 0.01;
    const d = this.createdAt || new Date();
    this.periodMonth = d.getMonth() + 1;
    this.periodYear = d.getFullYear();
    next();
});

journalEntrySchema.index({ referenceType: 1, referenceId: 1 });
journalEntrySchema.index({ periodYear: 1, periodMonth: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
