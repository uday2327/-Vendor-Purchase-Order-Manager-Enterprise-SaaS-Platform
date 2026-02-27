const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Asset', 'Liability', 'Expense', 'Revenue', 'Equity'], required: true },
    balance: { type: Number, default: 0 },
    description: { type: String, default: '' },
    isSystem: { type: Boolean, default: false },
}, { timestamps: true });

accountSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// Seed default chart of accounts for an organization
accountSchema.statics.seedDefaults = async function (organizationId) {
    const defaults = [
        { code: '1000', name: 'Cash', type: 'Asset', isSystem: true },
        { code: '1100', name: 'Bank Account', type: 'Asset', isSystem: true },
        { code: '2000', name: 'Accounts Payable', type: 'Liability', isSystem: true },
        { code: '2100', name: 'Tax Payable', type: 'Liability', isSystem: true },
        { code: '2200', name: 'Withholding Tax Payable', type: 'Liability', isSystem: true },
        { code: '3000', name: 'Owner Equity', type: 'Equity', isSystem: true },
        { code: '5000', name: 'General Expense', type: 'Expense', isSystem: true },
        { code: '5100', name: 'Materials Expense', type: 'Expense', isSystem: true },
        { code: '5200', name: 'Services Expense', type: 'Expense', isSystem: true },
        { code: '4000', name: 'Revenue', type: 'Revenue', isSystem: true },
    ];
    for (const acc of defaults) {
        await this.findOneAndUpdate(
            { organizationId, code: acc.code },
            { ...acc, organizationId },
            { upsert: true, new: true }
        );
    }
};

module.exports = mongoose.model('Account', accountSchema);
