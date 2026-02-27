const PurchaseOrder = require('../models/PurchaseOrder');
const Budget = require('../models/Budget');
const { logAudit } = require('../utils/auditLogger');

// Submit PO for approval
const submitPO = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });
        if (po.approvalStatus !== 'Draft' && po.approvalStatus !== 'Rejected') {
            return res.status(400).json({ message: `Cannot submit PO in '${po.approvalStatus}' status` });
        }

        po.approvalStatus = 'Submitted';
        po.approvalHistory.push({
            action: 'Submitted',
            approvedBy: req.user._id,
            comment: req.body.comment || '',
        });
        await po.save();

        await logAudit(req.user._id, 'SUBMIT', 'PurchaseOrder', po._id, { poNumber: po.poNumber });
        res.json(po);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve PO (admin/manager only)
const approvePO = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });
        if (po.approvalStatus !== 'Submitted') {
            return res.status(400).json({ message: 'PO must be in Submitted status to approve' });
        }

        // Budget check
        if (po.department) {
            const budget = await Budget.findOne({ department: po.department });
            if (budget) {
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                const monthlySpend = await PurchaseOrder.aggregate([
                    { $match: { department: po.department, approvalStatus: 'Approved', orderDate: { $gte: startOfMonth } } },
                    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                ]);
                const currentSpend = monthlySpend[0]?.total || 0;
                if (currentSpend + po.totalAmount > budget.monthlyLimit) {
                    return res.status(400).json({
                        message: `Budget exceeded! Department '${po.department}' limit: ₹${budget.monthlyLimit.toLocaleString()}, current spend: ₹${currentSpend.toLocaleString()}, PO amount: ₹${po.totalAmount.toLocaleString()}`,
                    });
                }
            }
        }

        po.approvalStatus = 'Approved';
        po.approvalHistory.push({
            action: 'Approved',
            approvedBy: req.user._id,
            comment: req.body.comment || '',
        });
        await po.save();

        await logAudit(req.user._id, 'APPROVE', 'PurchaseOrder', po._id, { poNumber: po.poNumber });
        res.json(po);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject PO (admin/manager only)
const rejectPO = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });
        if (po.approvalStatus !== 'Submitted') {
            return res.status(400).json({ message: 'PO must be in Submitted status to reject' });
        }

        po.approvalStatus = 'Rejected';
        po.approvalHistory.push({
            action: 'Rejected',
            approvedBy: req.user._id,
            comment: req.body.comment || 'Rejected',
        });
        await po.save();

        await logAudit(req.user._id, 'REJECT', 'PurchaseOrder', po._id, { poNumber: po.poNumber, reason: req.body.comment });
        res.json(po);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitPO, approvePO, rejectPO };
