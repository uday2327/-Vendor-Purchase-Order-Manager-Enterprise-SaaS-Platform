const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Vendor = require('../models/Vendor');
const VendorLedger = require('../models/VendorLedger');
const { logAudit } = require('../utils/auditLogger');
const { fireWebhookEvent } = require('./webhookController');

// Ledger helper — updates or creates ledger entry
const updateLedger = async (vendorId, type, amount, description, referenceId) => {
    let ledger = await VendorLedger.findOne({ vendor: vendorId });
    if (!ledger) ledger = new VendorLedger({ vendor: vendorId });

    if (type === 'Invoice') { ledger.totalInvoiced += amount; ledger.totalOutstanding += amount; }
    else if (type === 'Payment') { ledger.totalPaid += amount; ledger.totalOutstanding -= amount; }
    else if (type === 'Credit') { ledger.creditBalance += amount; ledger.totalOutstanding -= amount; }
    else if (type === 'Debit') { ledger.debitBalance += amount; ledger.totalOutstanding += amount; }

    ledger.lastUpdated = new Date();
    ledger.entries.push({ type, description, amount, balance: ledger.totalOutstanding, referenceId });
    await ledger.save();
    return ledger;
};

// @desc Get payments with filters
const getPayments = async (req, res) => {
    try {
        const { invoice, vendor, status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (invoice) query.invoice = invoice;
        if (vendor) query.vendor = vendor;
        if (status) query.paymentStatus = status;

        const total = await Payment.countDocuments(query);
        const payments = await Payment.find(query)
            .populate('invoice', 'invoiceNumber amount outstandingAmount')
            .populate('vendor', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json({ payments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc Create payment (manual or gateway trigger)
const createPayment = async (req, res) => {
    try {
        const { invoice: invoiceId, paymentMethod, amount, scheduledDate, gateway } = req.body;

        const invoice = await Invoice.findById(invoiceId).populate('vendor');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        if (invoice.paymentStatus === 'Paid') return res.status(400).json({ message: 'Invoice already fully paid' });
        if (amount > invoice.outstandingAmount) return res.status(400).json({ message: `Amount exceeds outstanding (₹${invoice.outstandingAmount})` });

        // GRN validation — block payment if PO not delivered
        const PurchaseOrder = require('../models/PurchaseOrder');
        const po = await PurchaseOrder.findById(invoice.purchaseOrder);
        if (po && po.status !== 'Delivered') {
            return res.status(400).json({ message: 'Cannot pay — Goods Receipt (PO delivery) not completed' });
        }

        // Early payment discount calculation
        let discountApplied = 0, discountPercentage = 0;
        const vendor = await Vendor.findById(invoice.vendor._id || invoice.vendor);
        if (vendor?.earlyPaymentDays > 0 && vendor?.earlyPaymentDiscountPercentage > 0) {
            const daysSinceInvoice = Math.floor((Date.now() - new Date(invoice.createdAt)) / (1000 * 60 * 60 * 24));
            if (daysSinceInvoice <= vendor.earlyPaymentDays) {
                discountPercentage = vendor.earlyPaymentDiscountPercentage;
                discountApplied = Math.round(amount * (discountPercentage / 100) * 100) / 100;
            }
        }

        const finalAmount = amount - discountApplied;

        // Payment approval check — high value payments need approval
        const APPROVAL_THRESHOLD = 100000; // ₹1 lakh
        const needsApproval = finalAmount >= APPROVAL_THRESHOLD;

        const payment = new Payment({
            invoice: invoiceId,
            vendor: invoice.vendor._id || invoice.vendor,
            amount: finalAmount,
            paymentMethod: paymentMethod || 'Manual',
            paymentGateway: gateway || 'Manual',
            paymentStatus: scheduledDate ? 'Pending' : (needsApproval ? 'Pending' : 'Success'),
            paymentApprovalStatus: needsApproval ? 'Submitted' : 'N/A',
            scheduledDate: scheduledDate || null,
            paidAt: (!scheduledDate && !needsApproval) ? new Date() : null,
            discountApplied,
            discountPercentage,
            createdBy: req.user._id,
        });

        await payment.save();

        // If immediate success (no scheduling, no approval needed)
        if (payment.paymentStatus === 'Success') {
            invoice.paidAmount += finalAmount;
            await invoice.save();

            await updateLedger(payment.vendor, 'Payment', finalAmount,
                `Payment ${payment.transactionId} for ${invoice.invoiceNumber}`, payment._id);

            if (discountApplied > 0) {
                await updateLedger(payment.vendor, 'Credit', discountApplied,
                    `Early payment discount (${discountPercentage}%)`, payment._id);
            }

            try { await fireWebhookEvent('invoice_paid', { invoiceNumber: invoice.invoiceNumber, amount: finalAmount }); } catch { }
        }

        await logAudit(req.user._id, 'CREATE', 'Payment', payment._id, {
            invoice: invoice.invoiceNumber, amount: finalAmount, method: payment.paymentMethod,
            discount: discountApplied, needsApproval,
        });

        res.status(201).json(payment);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc Approve/Reject payment
const approvePayment = async (req, res) => {
    try {
        const { action, comment } = req.body;
        if (!['Approved', 'Rejected'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (payment.paymentApprovalStatus !== 'Submitted') return res.status(400).json({ message: 'Payment not pending approval' });

        payment.paymentApprovalStatus = action;
        payment.approvalHistory.push({ action, approvedBy: req.user._id, comment });

        if (action === 'Approved') {
            payment.paymentStatus = payment.scheduledDate ? 'Pending' : 'Success';
            if (payment.paymentStatus === 'Success') {
                payment.paidAt = new Date();
                const invoice = await Invoice.findById(payment.invoice);
                if (invoice) {
                    invoice.paidAmount += payment.amount;
                    await invoice.save();
                    await updateLedger(payment.vendor, 'Payment', payment.amount,
                        `Payment approved: ${payment.transactionId}`, payment._id);
                }
            }
        } else {
            payment.paymentStatus = 'Failed';
        }

        await payment.save();
        await logAudit(req.user._id, 'UPDATE', 'Payment', payment._id, { action, comment });
        res.json(payment);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc Process scheduled payments (cron)
const processScheduledPayments = async () => {
    try {
        const now = new Date();
        const due = await Payment.find({
            paymentStatus: 'Pending',
            paymentApprovalStatus: { $in: ['Approved', 'N/A'] },
            scheduledDate: { $lte: now },
        });

        for (const payment of due) {
            const invoice = await Invoice.findById(payment.invoice);
            if (!invoice || invoice.paymentStatus === 'Paid') { payment.paymentStatus = 'Failed'; await payment.save(); continue; }

            if (payment.amount > invoice.outstandingAmount) { payment.paymentStatus = 'Failed'; await payment.save(); continue; }

            payment.paymentStatus = 'Success';
            payment.paidAt = new Date();
            await payment.save();

            invoice.paidAmount += payment.amount;
            await invoice.save();

            await updateLedger(payment.vendor, 'Payment', payment.amount,
                `Scheduled payment processed: ${payment.transactionId}`, payment._id);

            console.log(`[PaymentCron] Processed scheduled payment ${payment.transactionId}`);
        }
    } catch (err) { console.error('[PaymentCron] Error:', err.message); }
};

// @desc Get vendor ledger
const getVendorLedger = async (req, res) => {
    try {
        let ledger = await VendorLedger.findOne({ vendor: req.params.vendorId }).lean();
        if (!ledger) {
            // Build ledger from invoices and payments
            const invoices = await Invoice.find({ vendor: req.params.vendorId }).lean();
            const payments = await Payment.find({ vendor: req.params.vendorId, paymentStatus: 'Success' }).lean();
            ledger = {
                vendor: req.params.vendorId,
                totalInvoiced: invoices.reduce((s, i) => s + i.amount, 0),
                totalPaid: payments.reduce((s, p) => s + p.amount, 0),
                totalOutstanding: invoices.reduce((s, i) => s + (i.outstandingAmount || 0), 0),
                creditBalance: 0, debitBalance: 0, entries: [],
            };
        }
        res.json(ledger);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getPayments, createPayment, approvePayment, processScheduledPayments, getVendorLedger, updateLedger };
