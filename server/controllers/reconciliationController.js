const Payment = require('../models/Payment');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '../uploads/reconciliation') });

// @desc Upload bank statement CSV and auto-match with payments
const uploadBankStatement = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'CSV file required' });

        const records = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => records.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        if (records.length === 0) return res.status(400).json({ message: 'Empty CSV file' });

        // Fetch all payments for matching
        const payments = await Payment.find({ paymentStatus: 'Success' })
            .populate('invoice', 'invoiceNumber')
            .populate('vendor', 'name')
            .lean();

        const matched = [];
        const unmatched = [];
        const suggested = [];

        for (const record of records) {
            const txnId = record.transactionId || record.transaction_id || record.txn_id || record.reference || '';
            const amount = parseFloat(record.amount || record.Amount || record.value || 0);
            const date = record.date || record.Date || record.transaction_date || '';

            // Exact match by transaction ID
            const exactMatch = payments.find(p => p.transactionId === txnId);
            if (exactMatch) {
                matched.push({
                    bankRecord: record,
                    payment: {
                        transactionId: exactMatch.transactionId,
                        amount: exactMatch.amount,
                        invoiceNumber: exactMatch.invoice?.invoiceNumber,
                        vendorName: exactMatch.vendor?.name,
                        paidAt: exactMatch.paidAt,
                    },
                    matchType: 'Exact (Transaction ID)',
                });
                continue;
            }

            // Fuzzy match by amount + date proximity
            const amountMatches = payments.filter(p => Math.abs(p.amount - amount) < 1);
            if (amountMatches.length === 1) {
                suggested.push({
                    bankRecord: record,
                    payment: {
                        transactionId: amountMatches[0].transactionId,
                        amount: amountMatches[0].amount,
                        invoiceNumber: amountMatches[0].invoice?.invoiceNumber,
                        vendorName: amountMatches[0].vendor?.name,
                        paidAt: amountMatches[0].paidAt,
                    },
                    matchType: 'Suggested (Amount match)',
                    confidence: 'Medium',
                });
                continue;
            }

            unmatched.push({ bankRecord: record, reason: 'No matching payment found' });
        }

        res.json({
            summary: { total: records.length, matched: matched.length, suggested: suggested.length, unmatched: unmatched.length },
            matched, suggested, unmatched,
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { uploadBankStatement, uploadMiddleware: upload.single('file') };
