const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get all vendors
// @route   GET /api/vendors
const getVendors = async (req, res) => {
    try {
        const { search, sortBy, order, page = 1, limit = 10 } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const sortObj = {};
        if (sortBy) {
            sortObj[sortBy] = order === 'desc' ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const total = await Vendor.countDocuments(query);
        const vendors = await Vendor.find(query)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            vendors,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
const getVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create vendor
// @route   POST /api/vendors
const createVendor = async (req, res) => {
    try {
        const vendor = await Vendor.create(req.body);
        res.status(201).json(vendor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
const updateVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndDelete(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vendor performance
// @route   GET /api/vendors/:id/performance
const getVendorPerformance = async (req, res) => {
    try {
        const vendorId = req.params.id;
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const orders = await PurchaseOrder.find({ vendor: vendorId });
        const totalOrders = orders.length;

        if (totalOrders === 0) {
            return res.json({
                vendor,
                totalOrders: 0,
                onTimeDeliveryPercentage: 0,
                averageOrderValue: 0,
                lateDeliveryCount: 0,
                performanceScore: 0,
            });
        }

        const deliveredOrders = orders.filter((o) => o.status === 'Delivered');
        const lateDeliveryCount = deliveredOrders.filter(
            (o) => o.isLateDelivery
        ).length;
        const onTimeCount = deliveredOrders.length - lateDeliveryCount;
        const onTimeDeliveryPercentage =
            deliveredOrders.length > 0
                ? Math.round((onTimeCount / deliveredOrders.length) * 100)
                : 0;

        const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const averageOrderValue = Math.round(totalValue / totalOrders);

        // Score: on-time % * 0.5 + rating * 10 * 0.3 + (1 - late/total) * 100 * 0.2
        const ratingScore = (vendor.rating / 5) * 100;
        const lateRatio =
            totalOrders > 0 ? (1 - lateDeliveryCount / totalOrders) * 100 : 100;
        const performanceScore = Math.round(
            onTimeDeliveryPercentage * 0.5 + ratingScore * 0.3 + lateRatio * 0.2
        );

        // Update vendor performance score
        vendor.performanceScore = performanceScore;
        await vendor.save();

        res.json({
            vendor,
            totalOrders,
            onTimeDeliveryPercentage,
            averageOrderValue,
            lateDeliveryCount,
            performanceScore,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vendor order history
// @route   GET /api/vendors/:id/orders
const getVendorOrders = async (req, res) => {
    try {
        const orders = await PurchaseOrder.find({ vendor: req.params.id }).sort({
            createdAt: -1,
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Compare vendor prices for an item
// @route   GET /api/vendors/compare-prices?item=ItemName
const compareVendorPrices = async (req, res) => {
    try {
        const { item } = req.query;
        if (!item) {
            return res.status(400).json({ message: 'Item name is required' });
        }

        const vendors = await Vendor.find({
            'itemPrices.itemName': { $regex: item, $options: 'i' },
        });

        const comparison = vendors.map((v) => {
            const itemPrice = v.itemPrices.find(
                (p) => p.itemName.toLowerCase() === item.toLowerCase()
            );
            return {
                vendorId: v._id,
                vendorName: v.name,
                rating: v.rating,
                performanceScore: v.performanceScore,
                unitPrice: itemPrice ? itemPrice.unitPrice : null,
            };
        });

        comparison.sort((a, b) => (a.unitPrice || Infinity) - (b.unitPrice || Infinity));

        res.json(comparison);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    AI: Suggest best vendor for an item
// @route   GET /api/vendors/suggest?item=ItemName
const suggestBestVendor = async (req, res) => {
    try {
        const { item } = req.query;
        if (!item) {
            return res.status(400).json({ message: 'Item name is required' });
        }

        const vendors = await Vendor.find({
            'itemPrices.itemName': { $regex: item, $options: 'i' },
        });

        if (vendors.length === 0) {
            return res.json({ message: 'No vendors found for this item', vendors: [] });
        }

        // For each vendor, calculate score
        const scoredVendors = [];
        for (const v of vendors) {
            const orders = await PurchaseOrder.find({
                vendor: v._id,
                status: 'Delivered',
            });
            const totalDelivered = orders.length;
            const lateCount = orders.filter((o) => o.isLateDelivery).length;
            const onTimePct =
                totalDelivered > 0
                    ? ((totalDelivered - lateCount) / totalDelivered) * 100
                    : 50;

            const itemPrice = v.itemPrices.find(
                (p) => p.itemName.toLowerCase() === item.toLowerCase()
            );
            const price = itemPrice ? itemPrice.unitPrice : Infinity;

            // Score = (rating * 0.4) + (onTimePct * 0.4) + (1/price * 0.2) normalized
            const ratingNorm = (v.rating / 5) * 100;
            const priceScore = price > 0 ? (1 / price) * 10000 : 0;
            const aiScore =
                ratingNorm * 0.4 + onTimePct * 0.4 + Math.min(priceScore, 100) * 0.2;

            scoredVendors.push({
                vendorId: v._id,
                vendorName: v.name,
                rating: v.rating,
                onTimeDeliveryPct: Math.round(onTimePct),
                unitPrice: price,
                aiScore: Math.round(aiScore * 100) / 100,
            });
        }

        scoredVendors.sort((a, b) => b.aiScore - a.aiScore);

        res.json({
            bestVendor: scoredVendors[0],
            allVendors: scoredVendors,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getVendors,
    getVendor,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorPerformance,
    getVendorOrders,
    compareVendorPrices,
    suggestBestVendor,
};
