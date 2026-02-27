const mongoose = require('mongoose');

const accountingPeriodSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    isClosed: { type: Boolean, default: false },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
}, { timestamps: true });

accountingPeriodSchema.index({ organizationId: 1, month: 1, year: 1 }, { unique: true });

// Check if a given date falls in a closed period
accountingPeriodSchema.statics.isPeriodClosed = async function (date, organizationId) {
    const d = new Date(date);
    const period = await this.findOne({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        isClosed: true,
        ...(organizationId ? { organizationId } : {}),
    });
    return !!period;
};

module.exports = mongoose.model('AccountingPeriod', accountingPeriodSchema);
