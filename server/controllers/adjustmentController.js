const Adjustment = require('../models/Adjustment');
const Invoice = require('../models/Invoice');
const { logAudit } = require('../utils/auditLogger');
const { updateLedger } = require('./paymentController');

// @desc Create credit/debit note
const createAdjustment = async (req, res) => {
    try {
        const { type, invoice: invoiceId, amount, reason } = req.body;
        if (!type || !invoiceId || !amount || !reason) return res.status(400).json({ message: 'type, invoice, amount, and reason are required' });

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (type === 'Credit') {
            // Credit note reduces outstanding — prevent negative
            if (amount > invoice.outstandingAmount) {
                return res.status(400).json({ message: `Credit amount exceeds outstanding (₹${invoice.outstandingAmount})` });
            }
            invoice.paidAmount += amount; // Effectively reduces outstanding via pre-save hook
        } else {
            // Debit note increases outstanding
            invoice.paidAmount = Math.max(0, invoice.paidAmount - amount);
        }

        await invoice.save();

        const adjustment = await Adjustment.create({
            type, invoice: invoiceId, vendor: invoice.vendor,
            amount, reason, createdBy: req.user._id,
        });

        // Update vendor ledger
        await updateLedger(invoice.vendor, type, amount,
            `${type} note: ${reason} (${invoice.invoiceNumber})`, adjustment._id);

        await logAudit(req.user._id, 'CREATE', 'Adjustment', adjustment._id, {
            type, invoiceNumber: invoice.invoiceNumber, amount, reason,
        });

        res.status(201).json(adjustment);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc Get adjustments for an invoice
const getAdjustments = async (req, res) => {
    try {
        const { invoice, vendor } = req.query;
        const query = {};
        if (invoice) query.invoice = invoice;
        if (vendor) query.vendor = vendor;

        const adjustments = await Adjustment.find(query)
            .populate('invoice', 'invoiceNumber amount')
            .populate('vendor', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        res.json(adjustments);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createAdjustment, getAdjustments };
