const PurchaseOrder = require('../models/PurchaseOrder');

// @desc Spend forecasting using simple linear regression on monthly data
const getSpendForecast = async (req, res) => {
    try {
        const data = await PurchaseOrder.aggregate([
            { $group: { _id: { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        if (data.length < 2) return res.json({ forecast: [], message: 'Not enough data for forecasting' });

        const values = data.map((d, i) => ({ x: i, y: d.total }));
        const n = values.length;
        const sumX = values.reduce((s, v) => s + v.x, 0);
        const sumY = values.reduce((s, v) => s + v.y, 0);
        const sumXY = values.reduce((s, v) => s + v.x * v.y, 0);
        const sumX2 = values.reduce((s, v) => s + v.x * v.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Historical data with fitted values
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const historical = data.map((d, i) => ({
            label: `${monthNames[d._id.month - 1]} ${d._id.year}`,
            actual: d.total,
            predicted: Math.round(intercept + slope * i),
            count: d.count,
        }));

        // Forecast next 3 months
        const lastMonth = data[data.length - 1]._id;
        const forecast = [];
        for (let i = 1; i <= 3; i++) {
            let m = lastMonth.month + i;
            let y = lastMonth.year;
            if (m > 12) { m -= 12; y++; }
            forecast.push({
                label: `${monthNames[m - 1]} ${y}`,
                actual: null,
                predicted: Math.max(0, Math.round(intercept + slope * (n + i - 1))),
                isForecast: true,
            });
        }

        const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

        res.json({ historical, forecast, trend, slope: Math.round(slope), avgMonthly: Math.round(sumY / n) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Detect anomalous purchase orders
const getAnomalies = async (req, res) => {
    try {
        // Calculate baseline stats
        const stats = await PurchaseOrder.aggregate([
            { $group: { _id: null, avgAmount: { $avg: '$totalAmount' }, stdAmount: { $stdDevSamp: '$totalAmount' }, count: { $sum: 1 } } },
        ]);

        if (stats.length === 0 || !stats[0].stdAmount) return res.json({ anomalies: [], message: 'Not enough data' });

        const { avgAmount, stdAmount } = stats[0];
        const threshold = avgAmount + 2 * stdAmount; // 2 standard deviations

        // Find POs above threshold
        const anomalies = await PurchaseOrder.find({ totalAmount: { $gt: threshold } })
            .populate('vendor', 'name')
            .sort({ totalAmount: -1 })
            .limit(20)
            .lean();

        const flagged = anomalies.map(po => ({
            poNumber: po.poNumber,
            vendorName: po.vendor?.name || 'Unknown',
            totalAmount: po.totalAmount,
            deviation: ((po.totalAmount - avgAmount) / stdAmount).toFixed(1),
            reason: po.totalAmount > avgAmount + 3 * stdAmount ? 'Extreme outlier (>3σ)' : 'High value outlier (>2σ)',
            severity: po.totalAmount > avgAmount + 3 * stdAmount ? 'Critical' : 'Warning',
            orderDate: po.orderDate,
            status: po.status,
        }));

        // Also check for weekend orders (unusual timing)
        const weekendOrders = await PurchaseOrder.find({
            $expr: { $in: [{ $dayOfWeek: '$orderDate' }, [1, 7]] },
        }).populate('vendor', 'name').sort({ orderDate: -1 }).limit(10).lean();

        const weekendFlags = weekendOrders.map(po => ({
            poNumber: po.poNumber,
            vendorName: po.vendor?.name || 'Unknown',
            totalAmount: po.totalAmount,
            deviation: '—',
            reason: 'Weekend order (unusual timing)',
            severity: 'Info',
            orderDate: po.orderDate,
            status: po.status,
        }));

        res.json({
            anomalies: [...flagged, ...weekendFlags],
            stats: { avgAmount: Math.round(avgAmount), stdAmount: Math.round(stdAmount), threshold: Math.round(threshold) },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSpendForecast, getAnomalies };
