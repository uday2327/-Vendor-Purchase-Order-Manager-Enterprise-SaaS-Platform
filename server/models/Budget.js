const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
    {
        department: {
            type: String,
            required: [true, 'Department name is required'],
            trim: true,
        },
        monthlyLimit: {
            type: Number,
            required: [true, 'Monthly budget limit is required'],
            min: 0,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

budgetSchema.index({ department: 1, organizationId: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
