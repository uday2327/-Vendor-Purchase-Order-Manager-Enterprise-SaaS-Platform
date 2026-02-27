const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        purchaseOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseOrder',
            required: [true, 'Purchase order is required'],
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: [true, 'Vendor is required'],
        },
        invoiceNumber: {
            type: String,
            required: [true, 'Invoice number is required'],
            unique: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        outstandingAmount: {
            type: Number,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['Unpaid', 'Partial', 'Paid'],
            default: 'Unpaid',
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
        },
        invoiceFile: {
            type: String,
            default: '',
        },
        // Multi-currency
        currency: { type: String, default: 'INR', trim: true },
        exchangeRate: { type: Number, default: 1 },
        baseCurrencyAmount: { type: Number, default: 0 },
        // Tax engine
        taxableAmount: { type: Number, default: 0 },
        taxRate: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        withholdingPercentage: { type: Number, default: 0 },
        withholdingAmount: { type: Number, default: 0 },
        netPayable: { type: Number, default: 0 },
        // 3-way matching
        invoiceExceptionStatus: { type: String, enum: ['None', 'PriceMismatch', 'QuantityMismatch', 'TaxMismatch', 'GRNPending', 'PONotApproved'], default: 'None' },
        // Soft delete
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date },
        archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
        },
    },
    { timestamps: true }
);

// Auto-calculate outstanding, payment status, tax, netPayable
invoiceSchema.pre('save', function (next) {
    // Tax calculation
    this.taxAmount = Math.round(this.taxableAmount * (this.taxRate / 100) * 100) / 100;
    this.withholdingAmount = Math.round(this.amount * (this.withholdingPercentage / 100) * 100) / 100;
    this.netPayable = this.amount + this.taxAmount - this.withholdingAmount;
    // Currency conversion
    this.baseCurrencyAmount = Math.round(this.amount * this.exchangeRate * 100) / 100;

    this.outstandingAmount = this.netPayable - this.paidAmount;

    if (this.paidAmount <= 0) {
        this.paymentStatus = 'Unpaid';
    } else if (this.paidAmount >= this.netPayable) {
        this.paymentStatus = 'Paid';
        this.outstandingAmount = 0;
    } else {
        this.paymentStatus = 'Partial';
    }

    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
