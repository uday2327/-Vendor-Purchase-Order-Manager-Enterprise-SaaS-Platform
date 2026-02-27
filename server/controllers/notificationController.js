const Notification = require('../models/Notification');
const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');

// Get notifications for current user
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const filter = { user: req.user._id };
        if (unreadOnly === 'true') filter.read = false;

        const total = await Notification.countDocuments(filter);
        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

        res.json({ notifications, total, unreadCount, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === 'all') {
            await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
        } else {
            await Notification.findOneAndUpdate({ _id: id, user: req.user._id }, { read: true });
        }
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Auto-generate notifications (called on server startup or via cron)
const generateNotifications = async () => {
    try {
        const now = new Date();

        // Late deliveries
        const latePOs = await PurchaseOrder.find({
            status: 'Pending',
            expectedDeliveryDate: { $lt: now },
        }).populate('vendor', 'name').lean();

        for (const po of latePOs) {
            const exists = await Notification.findOne({
                'relatedEntity.entityId': po._id,
                type: 'late_delivery',
                createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
            });
            if (!exists) {
                await Notification.create({
                    type: 'late_delivery',
                    message: `PO ${po.poNumber} from ${po.vendor?.name || 'Unknown'} is past expected delivery date`,
                    relatedEntity: { entityType: 'PurchaseOrder', entityId: po._id },
                });
            }
        }

        // Overdue invoices
        const overdueInvoices = await Invoice.find({
            paymentStatus: { $ne: 'Paid' },
            dueDate: { $lt: now },
        }).lean();

        for (const inv of overdueInvoices) {
            const exists = await Notification.findOne({
                'relatedEntity.entityId': inv._id,
                type: 'overdue_invoice',
                createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
            });
            if (!exists) {
                await Notification.create({
                    type: 'overdue_invoice',
                    message: `Invoice ${inv.invoiceNumber} is overdue (₹${inv.outstandingAmount?.toLocaleString()} outstanding)`,
                    relatedEntity: { entityType: 'Invoice', entityId: inv._id },
                });
            }
        }

        console.log(`[Notifications] Generated at ${now.toISOString()}`);
    } catch (err) {
        console.error('Notification generation error:', err.message);
    }
};

module.exports = { getNotifications, markAsRead, generateNotifications };
