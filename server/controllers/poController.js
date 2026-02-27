const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
const getPurchaseOrders = async (req, res) => {
    try {
        const {
            status,
            vendor,
            search,
            sortBy,
            order,
            page = 1,
            limit = 10,
        } = req.query;
        const query = {};

        if (status) query.status = status;
        if (vendor) query.vendor = vendor;
        if (search) {
            query.$or = [
                { poNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const sortObj = {};
        if (sortBy) {
            sortObj[sortBy] = order === 'desc' ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const total = await PurchaseOrder.countDocuments(query);
        const purchaseOrders = await PurchaseOrder.find(query)
            .populate('vendor', 'name email')
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            purchaseOrders,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
const getPurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id).populate(
            'vendor',
            'name email phone'
        );
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        res.json(po);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create purchase order
// @route   POST /api/purchase-orders
const createPurchaseOrder = async (req, res) => {
    try {
        const po = new PurchaseOrder(req.body);
        await po.save();
        const populated = await po.populate('vendor', 'name email');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update purchase order
// @route   PUT /api/purchase-orders/:id
const updatePurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        Object.assign(po, req.body);
        await po.save();
        const populated = await po.populate('vendor', 'name email');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
const deletePurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        res.json({ message: 'Purchase order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update delivery status
// @route   PUT /api/purchase-orders/:id/delivery
const updateDeliveryStatus = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        po.status = req.body.status || po.status;
        po.actualDeliveryDate = req.body.actualDeliveryDate || po.actualDeliveryDate;

        await po.save();
        const populated = await po.populate('vendor', 'name email');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    AI: Check overspending on items
// @route   POST /api/purchase-orders/overspending-check
const overspendingCheck = async (req, res) => {
    try {
        const { items } = req.body; // [{ name, unitPrice }]
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Items are required' });
        }

        const alerts = [];

        for (const item of items) {
            // Find historical prices for this item across all POs
            const historicalPOs = await PurchaseOrder.find({
                'items.name': { $regex: `^${item.name}$`, $options: 'i' },
            });

            const historicalPrices = [];
            historicalPOs.forEach((po) => {
                po.items.forEach((poItem) => {
                    if (poItem.name.toLowerCase() === item.name.toLowerCase()) {
                        historicalPrices.push(poItem.unitPrice);
                    }
                });
            });

            if (historicalPrices.length > 0) {
                const avgPrice =
                    historicalPrices.reduce((s, p) => s + p, 0) / historicalPrices.length;
                const threshold = avgPrice * 1.15; // 15% above average

                if (item.unitPrice > threshold) {
                    alerts.push({
                        itemName: item.name,
                        currentPrice: item.unitPrice,
                        averageHistoricalPrice: Math.round(avgPrice * 100) / 100,
                        percentAbove:
                            Math.round(((item.unitPrice - avgPrice) / avgPrice) * 10000) / 100,
                        alert: `Price for "${item.name}" is ${Math.round(((item.unitPrice - avgPrice) / avgPrice) * 100)}% above the historical average of ₹${Math.round(avgPrice)}`,
                    });
                }
            }
        }

        res.json({
            hasAlerts: alerts.length > 0,
            alerts,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    updateDeliveryStatus,
    overspendingCheck,
};
