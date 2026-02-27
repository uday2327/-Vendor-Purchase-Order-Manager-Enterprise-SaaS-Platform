const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    events: [{ type: String, enum: ['po_created', 'po_approved', 'po_rejected', 'invoice_paid', 'budget_exceeded', 'vendor_created', 'delivery_late'] }],
    secret: { type: String },
    isActive: { type: Boolean, default: true },
    lastTriggered: { type: Date },
    failCount: { type: Number, default: 0 },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
}, { timestamps: true });

module.exports = mongoose.model('Webhook', webhookSchema);
