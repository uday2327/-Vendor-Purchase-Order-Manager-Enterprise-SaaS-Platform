const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
const getDashboardStats = async (req, res) => {
    try {
        // Total vendors
        const totalVendors = await Vendor.countDocuments();

        // Total purchase orders
        const totalPurchaseOrders = await PurchaseOrder.countDocuments();

        // Pending payments (Unpaid + Partial invoices)
        const pendingPayments = await Invoice.countDocuments({
            paymentStatus: { $in: ['Unpaid', 'Partial'] },
        });

        // Overdue payments (unpaid/partial + dueDate < now)
        const overduePayments = await Invoice.countDocuments({
            paymentStatus: { $in: ['Unpaid', 'Partial'] },
            dueDate: { $lt: new Date() },
        });

        // Late deliveries
        const lateDeliveries = await PurchaseOrder.countDocuments({
            isLateDelivery: true,
        });

        // Pending delivery count
        const pendingDeliveries = await PurchaseOrder.countDocuments({
            status: 'Pending',
        });

        // Total outstanding amount
        const outstandingAgg = await Invoice.aggregate([
            { $match: { paymentStatus: { $in: ['Unpaid', 'Partial'] } } },
            { $group: { _id: null, total: { $sum: '$outstandingAmount' } } },
        ]);
        const totalOutstanding =
            outstandingAgg.length > 0 ? outstandingAgg[0].total : 0;

        // Monthly purchase trend (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyTrend = await PurchaseOrder.aggregate([
            { $match: { orderDate: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$orderDate' },
                        month: { $month: '$orderDate' },
                    },
                    totalAmount: { $sum: '$totalAmount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const formattedTrend = monthlyTrend.map((m) => ({
            month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
            totalAmount: m.totalAmount,
            count: m.count,
        }));

        // Top performing vendor
        const topVendor = await Vendor.findOne()
            .sort({ performanceScore: -1 })
            .select('name performanceScore rating');

        // Vendor-wise expense breakdown
        const vendorExpense = await PurchaseOrder.aggregate([
            {
                $group: {
                    _id: '$vendor',
                    totalSpent: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 },
                },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'vendors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'vendorInfo',
                },
            },
            { $unwind: '$vendorInfo' },
            {
                $project: {
                    vendorName: '$vendorInfo.name',
                    totalSpent: 1,
                    orderCount: 1,
                },
            },
        ]);

        res.json({
            totalVendors,
            totalPurchaseOrders,
            pendingPayments,
            overduePayments,
            lateDeliveries,
            pendingDeliveries,
            totalOutstanding,
            monthlyTrend: formattedTrend,
            topVendor,
            vendorExpense,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
