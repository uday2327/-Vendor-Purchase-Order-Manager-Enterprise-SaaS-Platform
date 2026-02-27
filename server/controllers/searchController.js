const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');

// @desc    Global search across vendors, POs, invoices
// @route   GET /api/search?q=keyword
const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json({ vendors: [], purchaseOrders: [], invoices: [] });
        }

        const regex = new RegExp(q.trim(), 'i');

        const [vendors, purchaseOrders, invoices] = await Promise.all([
            Vendor.find({
                $or: [
                    { name: regex },
                    { contactPerson: regex },
                    { email: regex },
                    { phone: regex },
                ],
            })
                .select('name contactPerson email performanceScore')
                .limit(5)
                .lean(),

            PurchaseOrder.find({
                $or: [
                    { poNumber: regex },
                    { department: regex },
                ],
            })
                .populate('vendor', 'name')
                .select('poNumber vendor totalAmount status orderDate')
                .sort({ orderDate: -1 })
                .limit(5)
                .lean(),

            Invoice.find({
                $or: [
                    { invoiceNumber: regex },
                ],
            })
                .populate('vendor', 'name')
                .select('invoiceNumber vendor amount paymentStatus dueDate')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);

        res.json({ vendors, purchaseOrders, invoices });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { globalSearch };
