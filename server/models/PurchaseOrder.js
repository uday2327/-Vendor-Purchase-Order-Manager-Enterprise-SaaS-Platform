const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
    {
        poNumber: {
            type: String,
            unique: true,
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: [true, 'Vendor is required'],
        },
        items: [
            {
                name: { type: String, required: true, trim: true },
                qty: { type: Number, required: true, min: 1 },
                unitPrice: { type: Number, required: true, min: 0 },
                total: { type: Number, default: 0 },
            },
        ],
        totalAmount: {
            type: Number,
            default: 0,
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
        expectedDeliveryDate: {
            type: Date,
            required: [true, 'Expected delivery date is required'],
        },
        actualDeliveryDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['Pending', 'Delivered', 'Cancelled'],
            default: 'Pending',
        },
        isLateDelivery: {
            type: Boolean,
            default: false,
        },
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurringInterval: {
            type: String,
            enum: ['Weekly', 'Monthly', 'Quarterly', 'None'],
            default: 'None',
        },
        approvalStatus: {
            type: String,
            enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
            default: 'Draft',
        },
        approvalHistory: [
            {
                action: { type: String, enum: ['Submitted', 'Approved', 'Rejected'] },
                approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                timestamp: { type: Date, default: Date.now },
                comment: { type: String, default: '' },
            },
        ],
        department: {
            type: String,
            trim: true,
            default: 'General',
        },
        parentRecurringId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseOrder',
            default: null,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
        },
    },
    { timestamps: true }
);

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function (next) {
    // Calculate item totals and grand total
    this.items = this.items.map((item) => {
        item.total = item.qty * item.unitPrice;
        return item;
    });
    this.totalAmount = this.items.reduce((sum, item) => sum + item.total, 0);

    // Detect late delivery
    if (
        this.actualDeliveryDate &&
        this.expectedDeliveryDate &&
        this.actualDeliveryDate > this.expectedDeliveryDate
    ) {
        this.isLateDelivery = true;
    }

    // Auto-generate PO number on create
    if (this.isNew) {
        const count = await mongoose.model('PurchaseOrder').countDocuments();
        this.poNumber = `PO-${String(count + 1).padStart(4, '0')}`;
    }

    next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
