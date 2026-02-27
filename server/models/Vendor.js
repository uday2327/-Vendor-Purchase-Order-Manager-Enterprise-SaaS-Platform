const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Vendor name is required'],
            trim: true,
        },
        contactPerson: {
            type: String,
            required: [true, 'Contact person is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
            default: '',
        },
        gstTaxId: {
            type: String,
            trim: true,
            default: '',
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        performanceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        itemPrices: [
            {
                itemName: { type: String, trim: true },
                unitPrice: { type: Number, default: 0 },
            },
        ],
        riskIndex: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Low',
        },
        earlyPaymentDiscountPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        earlyPaymentDays: {
            type: Number,
            min: 0,
            default: 0,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);
