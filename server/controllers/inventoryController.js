const Inventory = require('../models/Inventory');
const PurchaseOrder = require('../models/PurchaseOrder');
const { logAudit } = require('../utils/auditLogger');

const getInventory = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const query = {};
        if (search) query.itemName = { $regex: search, $options: 'i' };

        const total = await Inventory.countDocuments(query);
        const items = await Inventory.find(query)
            .populate('preferredVendor', 'name')
            .sort({ currentStock: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const enriched = items.map(item => ({
            ...item,
            needsReorder: item.currentStock <= item.reorderPoint,
            stockStatus: item.currentStock <= 0 ? 'Out of Stock' : item.currentStock <= item.reorderPoint ? 'Low Stock' : 'In Stock',
        }));

        res.json({ items: enriched, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.create(req.body);
        res.status(201).json(item);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteInventoryItem = async (req, res) => {
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// Auto-reorder check - called by cron
const checkReorderPoints = async () => {
    try {
        const lowItems = await Inventory.find({
            autoReorder: true,
            $expr: { $lte: ['$currentStock', '$reorderPoint'] },
        }).populate('preferredVendor');

        for (const item of lowItems) {
            if (!item.preferredVendor) continue;
            // Check if a PO was already auto-generated recently
            const recentPO = await PurchaseOrder.findOne({
                vendor: item.preferredVendor._id,
                'items.name': item.itemName,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            });
            if (recentPO) continue;

            const po = new PurchaseOrder({
                vendor: item.preferredVendor._id,
                items: [{ name: item.itemName, qty: item.reorderQty, unitPrice: item.unitPrice }],
                expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                department: item.category,
            });
            await po.save();
            item.lastReorderDate = new Date();
            await item.save();
            await logAudit(null, 'AUTO_GENERATE', 'PurchaseOrder', po._id, {
                reason: 'auto_reorder', item: item.itemName, qty: item.reorderQty,
            });
            console.log(`[AutoReorder] Generated PO for ${item.itemName} (stock: ${item.currentStock})`);
        }
    } catch (err) { console.error('[AutoReorder] Error:', err.message); }
};

module.exports = { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, checkReorderPoints };
