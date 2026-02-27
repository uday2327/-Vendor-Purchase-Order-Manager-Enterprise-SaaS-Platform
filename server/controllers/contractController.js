const Contract = require('../models/Contract');
const { logAudit } = require('../utils/auditLogger');

const getContracts = async (req, res) => {
    try {
        const { status, vendor, page = 1, limit = 10 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (vendor) query.vendor = vendor;

        const total = await Contract.countDocuments(query);
        const contracts = await Contract.find(query)
            .populate('vendor', 'name')
            .sort({ endDate: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Add days until expiry
        const now = new Date();
        const enriched = contracts.map(c => ({
            ...c,
            daysUntilExpiry: Math.ceil((new Date(c.endDate) - now) / (1000 * 60 * 60 * 24)),
            isExpiringSoon: Math.ceil((new Date(c.endDate) - now) / (1000 * 60 * 60 * 24)) <= 30 && c.status === 'Active',
        }));

        res.json({ contracts: enriched, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createContract = async (req, res) => {
    try {
        const contract = await Contract.create(req.body);
        await logAudit(req.user._id, 'CREATE', 'Vendor', contract.vendor, { contractNumber: contract.contractNumber });
        res.status(201).json(contract);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateContract = async (req, res) => {
    try {
        const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!contract) return res.status(404).json({ message: 'Contract not found' });
        res.json(contract);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteContract = async (req, res) => {
    try {
        const contract = await Contract.findByIdAndDelete(req.params.id);
        if (!contract) return res.status(404).json({ message: 'Contract not found' });
        res.json({ message: 'Contract deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getContracts, createContract, updateContract, deleteContract };
