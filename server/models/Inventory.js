const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    sku: { type: String, unique: true },
    currentStock: { type: Number, default: 0 },
    reorderPoint: { type: Number, default: 10 },
    preferredVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    unitPrice: { type: Number, default: 0 },
    reorderQty: { type: Number, default: 50 },
    category: { type: String, default: 'General' },
    lastReorderDate: { type: Date },
    autoReorder: { type: Boolean, default: false },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
}, { timestamps: true });

inventorySchema.pre('save', function (next) {
    if (!this.sku) this.sku = 'SKU-' + Date.now().toString(36).toUpperCase();
    next();
});

inventorySchema.index({ itemName: 1 });
inventorySchema.index({ currentStock: 1, reorderPoint: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
