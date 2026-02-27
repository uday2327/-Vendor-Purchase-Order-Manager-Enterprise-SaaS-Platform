const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    isActive: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now },
}, { timestamps: true });

sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL 30 days

module.exports = mongoose.model('Session', sessionSchema);
