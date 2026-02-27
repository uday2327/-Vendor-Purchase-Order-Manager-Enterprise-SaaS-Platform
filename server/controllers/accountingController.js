const AccountingPeriod = require('../models/AccountingPeriod');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Accrual = require('../models/Accrual');
const BatchPayment = require('../models/BatchPayment');
const PurchaseOrder = require('../models/PurchaseOrder');
const { logAudit } = require('../utils/auditLogger');
const { updateLedger } = require('./paymentController');
const { journalForPayment, journalForAccrual, reverseAccrualJournal } = require('./journalController');

// ─── Accounting Period ───

const closePeriod = async (req, res) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) return res.status(400).json({ message: 'month and year required' });

        const period = await AccountingPeriod.findOneAndUpdate(
            { month, year },
            { isClosed: true, closedBy: req.user._id, closedAt: new Date() },
            { upsert: true, new: true }
        );

        await logAudit(req.user._id, 'CLOSE', 'AccountingPeriod', period._id, { month, year });
        res.json({ message: `Period ${month}/${year} closed`, period });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const reopenPeriod = async (req, res) => {
    try {
        const { month, year } = req.body;
        const period = await AccountingPeriod.findOneAndUpdate(
            { month, year }, { isClosed: false, closedBy: null, closedAt: null }, { new: true }
        );
        if (!period) return res.status(404).json({ message: 'Period not found' });

        await logAudit(req.user._id, 'REOPEN', 'AccountingPeriod', period._id, { month, year });
        res.json({ message: `Period ${month}/${year} reopened`, period });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getPeriods = async (req, res) => {
    try {
        const periods = await AccountingPeriod.find().populate('closedBy', 'name').sort({ year: -1, month: -1 }).lean();
        res.json(periods);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── Tax Report ───

const getTaxReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const match = {};
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const taxData = await Invoice.aggregate([
            { $match: { ...match, isArchived: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalInvoiced: { $sum: '$amount' },
                    totalTaxable: { $sum: '$taxableAmount' },
                    totalTax: { $sum: '$taxAmount' },
                    totalWithholding: { $sum: '$withholdingAmount' },
                    totalNetPayable: { $sum: '$netPayable' },
                    invoiceCount: { $sum: 1 },
                }
            },
        ]);

        const byRate = await Invoice.aggregate([
            { $match: { ...match, isArchived: { $ne: true }, taxRate: { $gt: 0 } } },
            { $group: { _id: '$taxRate', total: { $sum: '$taxAmount' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        res.json({ summary: taxData[0] || {}, byRate });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── 3-Way Matching ───

const getInvoiceExceptions = async (req, res) => {
    try {
        const exceptions = await Invoice.find({
            invoiceExceptionStatus: { $ne: 'None' }, isArchived: { $ne: true },
        }).populate('vendor', 'name').populate('purchaseOrder', 'poNumber status').sort({ createdAt: -1 }).lean();
        res.json(exceptions);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const runThreeWayMatch = async (invoiceId) => {
    const invoice = await Invoice.findById(invoiceId).populate('purchaseOrder');
    if (!invoice || !invoice.purchaseOrder) return;
    const po = invoice.purchaseOrder;

    if (po.approvalStatus !== 'Approved') { invoice.invoiceExceptionStatus = 'PONotApproved'; await invoice.save(); return; }
    if (po.status !== 'Delivered') { invoice.invoiceExceptionStatus = 'GRNPending'; await invoice.save(); return; }

    // Price match — total amounts
    if (Math.abs(invoice.amount - po.totalAmount) > 1) { invoice.invoiceExceptionStatus = 'PriceMismatch'; await invoice.save(); return; }

    invoice.invoiceExceptionStatus = 'None';
    await invoice.save();
};

// ─── Vendor Aging ───

const getVendorAging = async (req, res) => {
    try {
        const now = new Date();
        const d30 = new Date(now - 30 * 86400000);
        const d60 = new Date(now - 60 * 86400000);
        const d90 = new Date(now - 90 * 86400000);

        const invoices = await Invoice.find({
            paymentStatus: { $in: ['Unpaid', 'Partial'] }, isArchived: { $ne: true },
        }).populate('vendor', 'name').lean();

        const vendorMap = {};
        for (const inv of invoices) {
            const name = inv.vendor?.name || 'Unknown';
            if (!vendorMap[name]) vendorMap[name] = { vendor: name, current: 0, d30: 0, d60: 0, d90: 0, over90: 0, total: 0 };
            const outstanding = inv.outstandingAmount || 0;
            const due = new Date(inv.dueDate);

            if (due >= now) vendorMap[name].current += outstanding;
            else if (due >= d30) vendorMap[name].d30 += outstanding;
            else if (due >= d60) vendorMap[name].d60 += outstanding;
            else if (due >= d90) vendorMap[name].d90 += outstanding;
            else vendorMap[name].over90 += outstanding;

            vendorMap[name].total += outstanding;
        }

        const aging = Object.values(vendorMap).sort((a, b) => b.total - a.total);
        res.json(aging);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── Currency Summary ───

const getCurrencySummary = async (req, res) => {
    try {
        const byCurrency = await Invoice.aggregate([
            { $match: { isArchived: { $ne: true } } },
            { $group: { _id: '$currency', totalAmount: { $sum: '$amount' }, totalBase: { $sum: '$baseCurrencyAmount' }, count: { $sum: 1 } } },
            { $sort: { totalAmount: -1 } },
        ]);
        res.json(byCurrency);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── Batch Payment ───

const createBatchPayment = async (req, res) => {
    try {
        const { invoiceIds, paymentMethod } = req.body;
        if (!invoiceIds?.length) return res.status(400).json({ message: 'invoiceIds required' });

        const invoices = await Invoice.find({ _id: { $in: invoiceIds }, paymentStatus: { $ne: 'Paid' } });
        if (!invoices.length) return res.status(400).json({ message: 'No payable invoices found' });

        const batch = new BatchPayment({ invoices: invoiceIds, totalAmount: 0, createdBy: req.user._id });
        const Payment = require('../models/Payment');
        let processed = 0, failed = 0, totalAmt = 0;

        for (const invoice of invoices) {
            try {
                const amount = invoice.outstandingAmount;
                const payment = new Payment({
                    invoice: invoice._id, vendor: invoice.vendor, amount,
                    paymentMethod: paymentMethod || 'Manual', paymentGateway: 'Manual',
                    paymentStatus: 'Success', paidAt: new Date(), createdBy: req.user._id,
                });
                await payment.save();

                invoice.paidAmount += amount;
                await invoice.save();

                await updateLedger(invoice.vendor, 'Payment', amount, `Batch payment for ${invoice.invoiceNumber}`, payment._id);
                await journalForPayment(payment, invoice.invoiceNumber, req.user._id);

                batch.payments.push(payment._id);
                totalAmt += amount;
                processed++;
            } catch { failed++; }
        }

        batch.totalAmount = totalAmt;
        batch.processedCount = processed;
        batch.failedCount = failed;
        batch.batchStatus = failed === invoices.length ? 'Failed' : 'Completed';
        await batch.save();

        await logAudit(req.user._id, 'CREATE', 'BatchPayment', batch._id, { invoiceCount: invoices.length, totalAmount: totalAmt });
        res.status(201).json(batch);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── Accruals ───

const createAccrual = async (req, res) => {
    try {
        const { referenceType, referenceId, estimatedAmount, description } = req.body;
        const accrual = await Accrual.create({
            referenceType, referenceId, estimatedAmount, description, createdBy: req.user._id,
        });
        await journalForAccrual(accrual, description || '', req.user._id);
        await logAudit(req.user._id, 'CREATE', 'Accrual', accrual._id, { referenceType, estimatedAmount });
        res.status(201).json(accrual);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const reverseAccrual = async (req, res) => {
    try {
        const accrual = await Accrual.findById(req.params.id);
        if (!accrual) return res.status(404).json({ message: 'Accrual not found' });
        if (accrual.status !== 'Active') return res.status(400).json({ message: 'Only active accruals can be reversed' });

        accrual.status = 'Reversed';
        accrual.reversalDate = new Date();
        await accrual.save();

        await reverseAccrualJournal(accrual, `Reversal of accrual ${accrual._id}`, req.user._id);
        res.json(accrual);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAccruals = async (req, res) => {
    try {
        const accruals = await Accrual.find({ status: req.query.status || { $exists: true } })
            .populate('createdBy', 'name').sort({ createdAt: -1 }).lean();
        res.json(accruals);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── Soft Delete Archive ───

const archiveRecord = async (req, res) => {
    try {
        const { model, id } = req.params;
        const models = { Invoice, Payment, Adjustment: require('../models/Adjustment') };
        const Model = models[model];
        if (!Model) return res.status(400).json({ message: 'Invalid model' });

        const record = await Model.findByIdAndUpdate(id, {
            isArchived: true, archivedAt: new Date(), archivedBy: req.user._id,
        }, { new: true });

        if (!record) return res.status(404).json({ message: 'Record not found' });
        await logAudit(req.user._id, 'ARCHIVE', model, id, {});
        res.json({ message: `${model} archived`, record });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
    closePeriod, reopenPeriod, getPeriods,
    getTaxReport, getInvoiceExceptions, runThreeWayMatch,
    getVendorAging, getCurrencySummary,
    createBatchPayment, createAccrual, reverseAccrual, getAccruals,
    archiveRecord,
};
