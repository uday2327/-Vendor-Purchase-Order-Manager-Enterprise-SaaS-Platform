const Budget = require('../models/Budget');
const PurchaseOrder = require('../models/PurchaseOrder');

// Get all budgets
const getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find().lean();

        // Enrich with current month spend
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const enriched = [];

        for (const budget of budgets) {
            const spend = await PurchaseOrder.aggregate([
                { $match: { department: budget.department, approvalStatus: 'Approved', orderDate: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]);
            enriched.push({
                ...budget,
                currentSpend: spend[0]?.total || 0,
                utilization: budget.monthlyLimit > 0 ? (((spend[0]?.total || 0) / budget.monthlyLimit) * 100).toFixed(1) : 0,
            });
        }

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create budget
const createBudget = async (req, res) => {
    try {
        const { department, monthlyLimit } = req.body;
        const exists = await Budget.findOne({ department });
        if (exists) return res.status(400).json({ message: 'Budget for this department already exists' });

        const budget = await Budget.create({ department, monthlyLimit });
        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update budget
const updateBudget = async (req, res) => {
    try {
        const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!budget) return res.status(404).json({ message: 'Budget not found' });
        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete budget
const deleteBudget = async (req, res) => {
    try {
        await Budget.findByIdAndDelete(req.params.id);
        res.json({ message: 'Budget deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
