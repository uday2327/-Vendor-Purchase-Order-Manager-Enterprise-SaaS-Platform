const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

// @desc Cash flow dashboard analytics
const getCashFlow = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Upcoming payments (next 30 days) — scheduled + unpaid invoices
        const scheduledPayments = await Payment.find({
            paymentStatus: 'Pending',
            scheduledDate: { $gte: now, $lte: thirtyDaysLater },
        }).populate('vendor', 'name').populate('invoice', 'invoiceNumber').lean();

        const upcomingInvoices = await Invoice.find({
            paymentStatus: { $ne: 'Paid' },
            dueDate: { $gte: now, $lte: thirtyDaysLater },
        }).populate('vendor', 'name').sort({ dueDate: 1 }).limit(15).lean();

        // Overdue liabilities
        const overdueInvoices = await Invoice.find({
            paymentStatus: { $ne: 'Paid' },
            dueDate: { $lt: now },
        }).populate('vendor', 'name').lean();

        const totalOverdue = overdueInvoices.reduce((s, i) => s + (i.outstandingAmount || 0), 0);

        // Monthly outgoing projection (last 6 months + 3-month projection)
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyPayments = await Payment.aggregate([
            { $match: { paymentStatus: 'Success', paidAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = monthlyPayments.map(m => ({
            label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
            amount: m.total, count: m.count,
        }));

        // Average for projection
        const avgMonthly = monthlyPayments.length > 0
            ? Math.round(monthlyPayments.reduce((s, m) => s + m.total, 0) / monthlyPayments.length)
            : 0;

        // Vendor-wise payable summary (top 10)
        const vendorPayables = await Invoice.aggregate([
            { $match: { paymentStatus: { $in: ['Unpaid', 'Partial'] } } },
            { $group: { _id: '$vendor', totalOutstanding: { $sum: '$outstandingAmount' }, invoiceCount: { $sum: 1 } } },
            { $sort: { totalOutstanding: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendorInfo' } },
            { $unwind: '$vendorInfo' },
            { $project: { vendorName: '$vendorInfo.name', totalOutstanding: 1, invoiceCount: 1 } },
        ]);

        // Total outstanding across all invoices
        const totalOutstandingAgg = await Invoice.aggregate([
            { $match: { paymentStatus: { $in: ['Unpaid', 'Partial'] } } },
            { $group: { _id: null, total: { $sum: '$outstandingAmount' } } },
        ]);
        const totalOutstanding = totalOutstandingAgg.length > 0 ? totalOutstandingAgg[0].total : 0;

        res.json({
            summary: {
                totalOutstanding,
                totalOverdue,
                upcomingPaymentCount: upcomingInvoices.length + scheduledPayments.length,
                avgMonthlyOutgoing: avgMonthly,
            },
            upcoming: upcomingInvoices.map(i => ({
                invoiceNumber: i.invoiceNumber,
                vendorName: i.vendor?.name,
                amount: i.outstandingAmount,
                dueDate: i.dueDate,
                daysUntilDue: Math.ceil((new Date(i.dueDate) - now) / (1000 * 60 * 60 * 24)),
            })),
            overdue: {
                count: overdueInvoices.length,
                total: totalOverdue,
                items: overdueInvoices.slice(0, 10).map(i => ({
                    invoiceNumber: i.invoiceNumber,
                    vendorName: i.vendor?.name,
                    amount: i.outstandingAmount,
                    daysOverdue: Math.floor((now - new Date(i.dueDate)) / (1000 * 60 * 60 * 24)),
                })),
            },
            monthlyOutgoing: monthlyData,
            vendorPayables,
            scheduledPayments: scheduledPayments.map(p => ({
                transactionId: p.transactionId,
                vendorName: p.vendor?.name,
                amount: p.amount,
                scheduledDate: p.scheduledDate,
                invoiceNumber: p.invoice?.invoiceNumber,
            })),
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getCashFlow };
