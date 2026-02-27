/**
 * seedFinance.js — Seeds Phase D (Payments) + Phase E (Accounting) demo data
 * Run AFTER seed.js — does NOT clear existing users, vendors, POs, or invoices.
 * 
 * Usage: node seedFinance.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Invoice = require('./models/Invoice');
const Vendor = require('./models/Vendor');
const Payment = require('./models/Payment');
const VendorLedger = require('./models/VendorLedger');
const Adjustment = require('./models/Adjustment');
const Account = require('./models/Account');
const JournalEntry = require('./models/JournalEntry');
const AccountingPeriod = require('./models/AccountingPeriod');
const Accrual = require('./models/Accrual');
const PurchaseOrder = require('./models/PurchaseOrder');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
};

const seedFinance = async () => {
    try {
        await connectDB();

        // ── Clear only Phase D/E collections ──
        await Payment.deleteMany();
        await VendorLedger.deleteMany();
        await Adjustment.deleteMany();
        await Account.deleteMany();
        await JournalEntry.deleteMany();
        await AccountingPeriod.deleteMany();
        await Accrual.deleteMany();
        console.log('Cleared Phase D/E data...');

        // ── Get existing references ──
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) { console.error('No admin user found. Run seed.js first!'); process.exit(1); }

        const vendors = await Vendor.find().lean();
        const invoices = await Invoice.find().lean();
        const pos = await PurchaseOrder.find({ status: 'Delivered' }).lean();

        if (vendors.length < 3 || invoices.length < 5) {
            console.error('Not enough base data. Run seed.js first!');
            process.exit(1);
        }

        console.log(`Found ${vendors.length} vendors, ${invoices.length} invoices, ${pos.length} delivered POs`);

        // ── 1. Update vendors with early payment discount ──
        await Vendor.findByIdAndUpdate(vendors[0]._id, { earlyPaymentDiscountPercentage: 2, earlyPaymentDays: 10 });
        await Vendor.findByIdAndUpdate(vendors[1]._id, { earlyPaymentDiscountPercentage: 3, earlyPaymentDays: 7 });
        await Vendor.findByIdAndUpdate(vendors[3]._id, { earlyPaymentDiscountPercentage: 1.5, earlyPaymentDays: 15 });
        console.log('✅ 3 vendors updated with early payment discounts');

        // ── 2. Update invoices with tax & currency data ──
        const taxUpdates = [
            { id: invoices[0]._id, taxableAmount: invoices[0].amount, taxRate: 18, currency: 'INR', exchangeRate: 1 },
            { id: invoices[1]._id, taxableAmount: invoices[1].amount, taxRate: 18, currency: 'INR', exchangeRate: 1 },
            { id: invoices[2]._id, taxableAmount: invoices[2].amount, taxRate: 12, currency: 'INR', exchangeRate: 1 },
            { id: invoices[3]._id, taxableAmount: invoices[3].amount, taxRate: 18, withholdingPercentage: 2, currency: 'INR', exchangeRate: 1 },
            { id: invoices[4]._id, taxableAmount: invoices[4].amount, taxRate: 5, currency: 'USD', exchangeRate: 83.50 },
            { id: invoices[5]._id, taxableAmount: invoices[5].amount, taxRate: 18, currency: 'INR', exchangeRate: 1 },
            { id: invoices[6]._id, taxableAmount: invoices[6].amount, taxRate: 12, currency: 'EUR', exchangeRate: 90.20 },
            { id: invoices[7]._id, taxableAmount: invoices[7].amount, taxRate: 18, withholdingPercentage: 1, currency: 'INR', exchangeRate: 1 },
        ];

        for (const u of taxUpdates) {
            const inv = await Invoice.findById(u.id);
            if (!inv) continue;
            inv.taxableAmount = u.taxableAmount || 0;
            inv.taxRate = u.taxRate || 0;
            inv.withholdingPercentage = u.withholdingPercentage || 0;
            inv.currency = u.currency || 'INR';
            inv.exchangeRate = u.exchangeRate || 1;
            await inv.save(); // triggers pre-save to compute taxAmount, netPayable, etc.
        }
        console.log('✅ 8 invoices updated with tax & currency data');

        // ── 3. Seed Chart of Accounts ──
        await Account.seedDefaults();
        const accounts = await Account.find().lean();
        const accMap = {};
        for (const a of accounts) accMap[a.code] = a;
        console.log(`✅ ${accounts.length} accounts seeded`);

        // Helper
        const daysAgo = (d) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; };
        const daysFromNow = (d) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };

        // ── 4. Create Payments ──
        const refreshedInvoices = await Invoice.find().lean();
        const paymentData = [];

        // Payment 1: Full payment for INV-001 (already paid in seed, add formal payment record)
        paymentData.push({
            invoice: refreshedInvoices[0]._id, vendor: refreshedInvoices[0].vendor,
            amount: refreshedInvoices[0].paidAmount, paymentMethod: 'Bank Transfer', paymentGateway: 'Manual',
            paymentStatus: 'Success', paidAt: daysAgo(28), createdBy: admin._id,
            currency: 'INR', exchangeRate: 1, baseCurrencyAmount: refreshedInvoices[0].paidAmount,
        });

        // Payment 2: Full payment for INV-002
        paymentData.push({
            invoice: refreshedInvoices[1]._id, vendor: refreshedInvoices[1].vendor,
            amount: refreshedInvoices[1].paidAmount, paymentMethod: 'Card', paymentGateway: 'Stripe',
            paymentStatus: 'Success', paidAt: daysAgo(22), createdBy: admin._id,
            transactionId: 'TXN-STRIPE-001', currency: 'INR', exchangeRate: 1,
            baseCurrencyAmount: refreshedInvoices[1].paidAmount,
        });

        // Payment 3: Partial payment for INV-003
        paymentData.push({
            invoice: refreshedInvoices[2]._id, vendor: refreshedInvoices[2].vendor,
            amount: 100000, paymentMethod: 'UPI', paymentGateway: 'Razorpay',
            paymentStatus: 'Success', paidAt: daysAgo(8), createdBy: admin._id,
            transactionId: 'TXN-RZPY-001', currency: 'INR', exchangeRate: 1,
            baseCurrencyAmount: 100000,
        });

        // Payment 4: Failed payment for INV-004
        paymentData.push({
            invoice: refreshedInvoices[3]._id, vendor: refreshedInvoices[3].vendor,
            amount: 20000, paymentMethod: 'Card', paymentGateway: 'Stripe',
            paymentStatus: 'Failed', createdBy: admin._id,
            retryCount: 2, lastRetryAt: daysAgo(3),
            transactionId: 'TXN-STRIPE-FAIL-001', currency: 'INR', exchangeRate: 1,
        });

        // Payment 5: Partial for INV-005 (USD)
        paymentData.push({
            invoice: refreshedInvoices[4]._id, vendor: refreshedInvoices[4].vendor,
            amount: 50000, paymentMethod: 'Bank Transfer', paymentGateway: 'Manual',
            paymentStatus: 'Success', paidAt: daysAgo(4), createdBy: admin._id,
            currency: 'USD', exchangeRate: 83.50, baseCurrencyAmount: 50000 * 83.50,
        });

        // Payment 6: Full for INV-007 (EUR)
        paymentData.push({
            invoice: refreshedInvoices[6]._id, vendor: refreshedInvoices[6].vendor,
            amount: refreshedInvoices[6].paidAmount, paymentMethod: 'Bank Transfer', paymentGateway: 'Manual',
            paymentStatus: 'Success', paidAt: daysAgo(1), createdBy: admin._id,
            currency: 'EUR', exchangeRate: 90.20,
            baseCurrencyAmount: refreshedInvoices[6].paidAmount * 90.20,
        });

        // Payment 7: Scheduled payment for INV-006
        paymentData.push({
            invoice: refreshedInvoices[5]._id, vendor: refreshedInvoices[5].vendor,
            amount: refreshedInvoices[5].netPayable || refreshedInvoices[5].amount, paymentMethod: 'Bank Transfer',
            paymentGateway: 'Manual', paymentStatus: 'Pending',
            scheduledDate: daysFromNow(5), createdBy: admin._id,
            currency: 'INR', exchangeRate: 1,
        });

        // Payment 8: High-value payment needing approval
        paymentData.push({
            invoice: refreshedInvoices[7]._id, vendor: refreshedInvoices[7].vendor,
            amount: 82500, paymentMethod: 'Bank Transfer', paymentGateway: 'Manual',
            paymentStatus: 'Pending', paymentApprovalStatus: 'Submitted',
            createdBy: admin._id, currency: 'INR', exchangeRate: 1,
        });

        const payments = [];
        for (const p of paymentData) {
            const payment = new Payment(p);
            await payment.save();
            payments.push(payment);
        }
        console.log(`✅ ${payments.length} payments created`);

        // ── 5. Create Vendor Ledgers ──
        const vendorGroups = {};
        for (const inv of refreshedInvoices) {
            const vid = inv.vendor.toString();
            if (!vendorGroups[vid]) vendorGroups[vid] = { invoiced: 0, paid: 0, outstanding: 0, entries: [] };
            vendorGroups[vid].invoiced += inv.amount;
            vendorGroups[vid].paid += inv.paidAmount;
            vendorGroups[vid].outstanding += (inv.outstandingAmount || 0);
            vendorGroups[vid].entries.push({
                date: inv.createdAt, type: 'Invoice', description: `Invoice ${inv.invoiceNumber}`,
                amount: inv.amount, balance: vendorGroups[vid].outstanding, referenceId: inv._id,
            });
        }

        for (const p of payments.filter(p => p.paymentStatus === 'Success')) {
            const vid = p.vendor.toString();
            if (vendorGroups[vid]) {
                vendorGroups[vid].entries.push({
                    date: p.paidAt, type: 'Payment', description: `Payment ${p.transactionId}`,
                    amount: p.amount, balance: vendorGroups[vid].outstanding - p.amount, referenceId: p._id,
                });
            }
        }

        for (const [vendorId, data] of Object.entries(vendorGroups)) {
            await VendorLedger.create({
                vendor: vendorId, totalInvoiced: data.invoiced, totalPaid: data.paid,
                totalOutstanding: data.outstanding, entries: data.entries,
            });
        }
        console.log(`✅ ${Object.keys(vendorGroups).length} vendor ledgers created`);

        // ── 6. Create Adjustments ──
        // Credit note on INV-003 (price dispute)
        await Adjustment.create({
            type: 'Credit', invoice: refreshedInvoices[2]._id, vendor: refreshedInvoices[2].vendor,
            amount: 5000, reason: 'Price dispute — excess charged on Cement Bags', createdBy: admin._id,
        });
        // Debit note on INV-005 (additional freight charges)
        await Adjustment.create({
            type: 'Debit', invoice: refreshedInvoices[4]._id, vendor: refreshedInvoices[4].vendor,
            amount: 3500, reason: 'Additional freight charges for express delivery', createdBy: admin._id,
        });
        // Credit note on INV-008 (damaged goods returned)
        await Adjustment.create({
            type: 'Credit', invoice: refreshedInvoices[7]._id, vendor: refreshedInvoices[7].vendor,
            amount: 8250, reason: 'Damaged PVC Pipes returned — 10% of value', createdBy: admin._id,
        });
        console.log('✅ 3 adjustments created (2 credits, 1 debit)');

        // ── 7. Create Journal Entries ──
        const createJE = async (refType, refId, desc, entries) => {
            const je = new JournalEntry({
                referenceType: refType, referenceId: refId, description: desc,
                entries: entries.map(e => ({
                    account: accMap[e.code]?._id, accountName: accMap[e.code]?.name || e.code,
                    debit: e.debit || 0, credit: e.credit || 0,
                })),
                createdBy: admin._id,
            });
            await je.save();
            return je;
        };

        // Journal entries for each paid invoice
        for (const inv of refreshedInvoices.slice(0, 3)) {
            await createJE('Invoice', inv._id, `Invoice ${inv.invoiceNumber} — ₹${inv.amount}`, [
                { code: '5000', debit: inv.amount },
                { code: '2100', debit: inv.taxAmount || 0 },
                { code: '2000', credit: (inv.netPayable || inv.amount) + (inv.taxAmount || 0) },
            ]);
        }

        // Journal entries for successful payments
        for (const p of payments.filter(p => p.paymentStatus === 'Success')) {
            const inv = refreshedInvoices.find(i => i._id.toString() === p.invoice.toString());
            await createJE('Payment', p._id, `Payment ${p.transactionId} for ${inv?.invoiceNumber || 'Invoice'}`, [
                { code: '2000', debit: p.amount },
                { code: '1000', credit: p.amount },
            ]);
        }

        // Journal entries for adjustments
        await createJE('Adjustment', refreshedInvoices[2]._id, 'Credit Note: Price dispute INV-003', [
            { code: '2000', debit: 5000 }, { code: '5000', credit: 5000 },
        ]);
        await createJE('Adjustment', refreshedInvoices[4]._id, 'Debit Note: Freight charges INV-005', [
            { code: '5000', debit: 3500 }, { code: '2000', credit: 3500 },
        ]);

        const totalJE = await JournalEntry.countDocuments();
        console.log(`✅ ${totalJE} journal entries created`);

        // ── 8. Create Accounting Periods ──
        const now = new Date();
        // Close last month
        const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
        const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        await AccountingPeriod.create({
            month: lastMonth, year: lastYear, isClosed: true, closedBy: admin._id, closedAt: daysAgo(1),
        });
        // Current month open
        await AccountingPeriod.create({
            month: now.getMonth() + 1, year: now.getFullYear(), isClosed: false,
        });
        console.log('✅ 2 accounting periods created (1 closed, 1 open)');

        // ── 9. Create Accruals ──
        // Accrual for a pending PO (expense recognized before invoice)
        const pendingPO = await PurchaseOrder.findOne({ status: 'Pending' }).lean();
        if (pendingPO) {
            const accrual = await Accrual.create({
                referenceType: 'PurchaseOrder', referenceId: pendingPO._id,
                description: `Accrued expense for PO ${pendingPO.poNumber} — materials expected`,
                estimatedAmount: pendingPO.totalAmount,
                accrualDate: daysAgo(5), status: 'Active', createdBy: admin._id,
            });
            // Create journal entry for the accrual
            await createJE('Accrual', accrual._id, `Accrual: Expected expense for PO ${pendingPO.poNumber}`, [
                { code: '5000', debit: pendingPO.totalAmount },
                { code: '2000', credit: pendingPO.totalAmount },
            ]);
        }

        // Reversed accrual (matched with INV-010)
        if (refreshedInvoices.length >= 10) {
            const accrual2 = await Accrual.create({
                referenceType: 'PurchaseOrder', referenceId: pos[0]._id,
                description: 'Accrued expense — reversed when invoice received',
                estimatedAmount: 75000, accrualDate: daysAgo(20),
                reversalDate: daysAgo(5), status: 'Reversed',
                matchedInvoice: refreshedInvoices[9]._id, createdBy: admin._id,
            });
            await createJE('Accrual', accrual2._id, 'Accrual Reversal: Invoice received', [
                { code: '2000', debit: 75000 }, { code: '5000', credit: 75000 },
            ]);
        }
        console.log('✅ 2 accruals created (1 active, 1 reversed)');

        // ── 10. Update account balances from journal entries ──
        const allJE = await JournalEntry.find().lean();
        const balances = {};
        for (const je of allJE) {
            for (const e of je.entries) {
                const aid = e.account?.toString();
                if (!aid) continue;
                if (!balances[aid]) balances[aid] = 0;
                balances[aid] += (e.debit || 0) - (e.credit || 0);
            }
        }
        for (const [accId, balance] of Object.entries(balances)) {
            await Account.findByIdAndUpdate(accId, { balance });
        }
        console.log('✅ Account balances updated from journal entries');

        // ── Summary ──
        console.log('\n' + '═'.repeat(50));
        console.log('  ✅  FINANCE DATA SEED COMPLETE');
        console.log('═'.repeat(50));
        console.log(`  Payments:          ${payments.length}`);
        console.log(`  Vendor Ledgers:    ${Object.keys(vendorGroups).length}`);
        console.log(`  Adjustments:       3`);
        console.log(`  Journal Entries:   ${await JournalEntry.countDocuments()}`);
        console.log(`  Accounts:          ${accounts.length}`);
        console.log(`  Accounting Periods:2`);
        console.log(`  Accruals:          2`);
        console.log(`  Invoices (updated):8 (with tax/currency)`);
        console.log(`  Vendors (updated): 3 (with early pay discount)`);
        console.log('═'.repeat(50));
        console.log('  Login: admin@vendor.com / admin123');
        console.log('═'.repeat(50) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedFinance();
