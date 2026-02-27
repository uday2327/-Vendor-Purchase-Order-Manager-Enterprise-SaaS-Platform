const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    title: { type: String, required: true },
    contractNumber: { type: String, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    value: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Expired', 'Pending', 'Terminated'], default: 'Pending' },
    terms: { type: String },
    filePath: { type: String },
    renewalReminder: { type: Boolean, default: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
}, { timestamps: true });

contractSchema.pre('save', function (next) {
    if (!this.contractNumber) {
        this.contractNumber = 'CTR-' + Date.now().toString(36).toUpperCase();
    }
    // Auto-update status based on dates
    const now = new Date();
    if (this.endDate < now && this.status === 'Active') this.status = 'Expired';
    if (this.startDate <= now && this.endDate >= now && this.status === 'Pending') this.status = 'Active';
    next();
});

contractSchema.index({ vendor: 1 });
contractSchema.index({ endDate: 1 });
contractSchema.index({ status: 1 });

module.exports = mongoose.model('Contract', contractSchema);
