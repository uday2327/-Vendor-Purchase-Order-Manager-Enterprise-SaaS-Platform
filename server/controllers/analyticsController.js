const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');

// Payment Aging Report: Current, 0-30, 31-60, 60+ days overdue
const getPaymentAging = async (req, res) => {
    try {
        const now = new Date();
        const invoices = await Invoice.find({ paymentStatus: { $ne: 'Paid' } }).lean();

        const buckets = {
            'Current': { count: 0, total: 0 },
            '1-30 Days': { count: 0, total: 0 },
            '31-60 Days': { count: 0, total: 0 },
            '60+ Days': { count: 0, total: 0 },
        };

        invoices.forEach((inv) => {
            const daysOverdue = Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
            const outstanding = inv.outstandingAmount || 0;
            if (daysOverdue <= 0) { buckets['Current'].count++; buckets['Current'].total += outstanding; }
            else if (daysOverdue <= 30) { buckets['1-30 Days'].count++; buckets['1-30 Days'].total += outstanding; }
            else if (daysOverdue <= 60) { buckets['31-60 Days'].count++; buckets['31-60 Days'].total += outstanding; }
            else { buckets['60+ Days'].count++; buckets['60+ Days'].total += outstanding; }
        });

        // Filter out empty buckets so the chart doesn't render zero-value slices
        const result = Object.entries(buckets)
            .map(([range, data]) => ({ range, ...data }))
            .filter((b) => b.count > 0);

        res.json(result.length > 0 ? result : [{ range: 'No Data', count: 0, total: 0 }]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Vendor Spend Distribution
const getVendorSpend = async (req, res) => {
    try {
        const spend = await PurchaseOrder.aggregate([
            { $match: { status: { $in: ['Delivered', 'Pending'] } } },
            { $group: { _id: '$vendor', totalSpend: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
            { $sort: { totalSpend: -1 } },
            { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $project: { vendorName: '$vendor.name', totalSpend: 1, orderCount: 1 } },
        ]);
        res.json(spend);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Monthly Growth %
const getMonthlyGrowth = async (req, res) => {
    try {
        const data = await PurchaseOrder.aggregate([
            { $group: { _id: { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $project: { year: '$_id.year', month: '$_id.month', total: 1, count: 1, _id: 0 } },
        ]);

        const withGrowth = data.map((item, i) => ({
            ...item,
            label: `${item.year}-${String(item.month).padStart(2, '0')}`,
            growth: i > 0 && data[i - 1].total > 0 ? (((item.total - data[i - 1].total) / data[i - 1].total) * 100).toFixed(1) : 0,
        }));

        res.json(withGrowth);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Vendor Reliability Ranking
const getVendorReliability = async (req, res) => {
    try {
        const vendors = await Vendor.find().lean();
        const rankings = [];

        for (const vendor of vendors) {
            const orders = await PurchaseOrder.find({ vendor: vendor._id, status: 'Delivered' }).lean();
            const totalOrders = orders.length;
            const lateOrders = orders.filter((o) => o.isLateDelivery).length;
            const onTimePercent = totalOrders > 0 ? (((totalOrders - lateOrders) / totalOrders) * 100).toFixed(1) : 100;

            rankings.push({
                vendorId: vendor._id,
                vendorName: vendor.name,
                rating: vendor.rating,
                performanceScore: vendor.performanceScore,
                riskIndex: vendor.riskIndex || 'Low',
                totalOrders,
                lateOrders,
                onTimePercent: parseFloat(onTimePercent),
            });
        }

        rankings.sort((a, b) => b.onTimePercent - a.onTimePercent || b.rating - a.rating);
        res.json(rankings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPaymentAging, getVendorSpend, getMonthlyGrowth, getVendorReliability };
