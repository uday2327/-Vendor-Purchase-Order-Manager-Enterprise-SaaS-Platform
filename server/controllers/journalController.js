const JournalEntry = require('../models/JournalEntry');
const Account = require('../models/Account');
const AccountingPeriod = require('../models/AccountingPeriod');

// Helper: find or create system account by code
const getSystemAccount = async (code) => {
    let acc = await Account.findOne({ code });
    if (!acc) { await Account.seedDefaults(); acc = await Account.findOne({ code }); }
    return acc;
};

// @desc Create journal entry for a transaction (called internally)
const createJournalEntry = async ({ referenceType, referenceId, description, entries, userId }) => {
    try {
        // Check period lock
        const now = new Date();
        const locked = await AccountingPeriod.isPeriodClosed(now);
        if (locked) { console.log('[Journal] Period locked, skipping entry'); return null; }

        // Resolve account IDs from codes
        const resolvedEntries = [];
        for (const e of entries) {
            const account = typeof e.account === 'string' ? await getSystemAccount(e.account) : { _id: e.account };
            if (!account) continue;
            resolvedEntries.push({
                account: account._id, accountName: e.accountName || account.name || '',
                debit: e.debit || 0, credit: e.credit || 0,
            });
        }

        const journal = new JournalEntry({
            referenceType, referenceId, description,
            entries: resolvedEntries, createdBy: userId,
        });
        await journal.save();

        // Update account balances
        for (const e of resolvedEntries) {
            const delta = (e.debit || 0) - (e.credit || 0);
            await Account.findByIdAndUpdate(e.account, { $inc: { balance: delta } });
        }

        return journal;
    } catch (err) { console.error('[Journal] Error:', err.message); return null; }
};

// @desc Create journal for invoice creation
const journalForInvoice = async (invoice, userId) => {
    return createJournalEntry({
        referenceType: 'Invoice', referenceId: invoice._id,
        description: `Invoice ${invoice.invoiceNumber} — ₹${invoice.netPayable || invoice.amount}`,
        entries: [
            { account: '5000', accountName: 'General Expense', debit: invoice.amount },
            ...(invoice.taxAmount > 0 ? [{ account: '2100', accountName: 'Tax Payable', debit: invoice.taxAmount }] : []),
            ...(invoice.withholdingAmount > 0 ? [{ account: '2200', accountName: 'Withholding Tax Payable', credit: invoice.withholdingAmount }] : []),
            { account: '2000', accountName: 'Accounts Payable', credit: invoice.netPayable || invoice.amount },
        ],
        userId,
    });
};

// @desc Create journal for payment
const journalForPayment = async (payment, invoiceNumber, userId) => {
    return createJournalEntry({
        referenceType: 'Payment', referenceId: payment._id,
        description: `Payment ${payment.transactionId} for ${invoiceNumber}`,
        entries: [
            { account: '2000', accountName: 'Accounts Payable', debit: payment.amount },
            { account: '1000', accountName: 'Cash', credit: payment.amount },
        ],
        userId,
    });
};

// @desc Create journal for adjustment
const journalForAdjustment = async (adjustment, invoiceNumber, userId) => {
    if (adjustment.type === 'Credit') {
        return createJournalEntry({
            referenceType: 'Adjustment', referenceId: adjustment._id,
            description: `Credit Note: ${adjustment.reason} (${invoiceNumber})`,
            entries: [
                { account: '2000', accountName: 'Accounts Payable', debit: adjustment.amount },
                { account: '5000', accountName: 'General Expense', credit: adjustment.amount },
            ],
            userId,
        });
    } else {
        return createJournalEntry({
            referenceType: 'Adjustment', referenceId: adjustment._id,
            description: `Debit Note: ${adjustment.reason} (${invoiceNumber})`,
            entries: [
                { account: '5000', accountName: 'General Expense', debit: adjustment.amount },
                { account: '2000', accountName: 'Accounts Payable', credit: adjustment.amount },
            ],
            userId,
        });
    }
};

// @desc Create journal for accrual
const journalForAccrual = async (accrual, description, userId) => {
    return createJournalEntry({
        referenceType: 'Accrual', referenceId: accrual._id,
        description: `Accrual: ${description}`,
        entries: [
            { account: '5000', accountName: 'General Expense', debit: accrual.estimatedAmount },
            { account: '2000', accountName: 'Accounts Payable', credit: accrual.estimatedAmount },
        ],
        userId,
    });
};

// @desc Reverse accrual journal
const reverseAccrualJournal = async (accrual, description, userId) => {
    return createJournalEntry({
        referenceType: 'Accrual', referenceId: accrual._id,
        description: `Accrual Reversal: ${description}`,
        entries: [
            { account: '2000', accountName: 'Accounts Payable', debit: accrual.estimatedAmount },
            { account: '5000', accountName: 'General Expense', credit: accrual.estimatedAmount },
        ],
        userId,
    });
};

// @desc List journal entries
const getJournalEntries = async (req, res) => {
    try {
        const { page = 1, limit = 20, referenceType, month, year } = req.query;
        const query = {};
        if (referenceType) query.referenceType = referenceType;
        if (month) query.periodMonth = parseInt(month);
        if (year) query.periodYear = parseInt(year);

        const total = await JournalEntry.countDocuments(query);
        const entries = await JournalEntry.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json({ entries, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc Get chart of accounts
const getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find().sort({ code: 1 }).lean();
        if (accounts.length === 0) {
            await Account.seedDefaults();
            const seeded = await Account.find().sort({ code: 1 }).lean();
            return res.json(seeded);
        }
        res.json(accounts);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
    createJournalEntry, journalForInvoice, journalForPayment, journalForAdjustment,
    journalForAccrual, reverseAccrualJournal, getJournalEntries, getAccounts,
};
