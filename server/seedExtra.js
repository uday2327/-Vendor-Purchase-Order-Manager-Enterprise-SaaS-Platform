/**
 * seedExtra.js — Seeds Budgets, Contracts, Inventory, Notifications, AuditLogs, Webhooks
 * Run AFTER seed.js — does NOT clear users, vendors, POs, or invoices.
 * 
 * Usage: node seedExtra.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const PurchaseOrder = require('./models/PurchaseOrder');
const Invoice = require('./models/Invoice');
const Budget = require('./models/Budget');
const Contract = require('./models/Contract');
const Inventory = require('./models/Inventory');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const Webhook = require('./models/Webhook');

dotenv.config();

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
};

const seedExtra = async () => {
    try {
        await connectDB();

        // Clear only these collections
        await Budget.deleteMany();
        await Contract.deleteMany();
        await Inventory.deleteMany();
        await Notification.deleteMany();
        await AuditLog.deleteMany();
        await Webhook.deleteMany();
        console.log('Cleared Budgets, Contracts, Inventory, Notifications, AuditLogs, Webhooks...');

        // Get references
        const admin = await User.findOne({ role: 'admin' });
        const manager = await User.findOne({ role: 'manager' });
        const accountant = await User.findOne({ role: 'accountant' });
        if (!admin) { console.error('No admin user! Run seed.js first.'); process.exit(1); }

        const vendors = await Vendor.find().lean();
        const pos = await PurchaseOrder.find().lean();
        const invoices = await Invoice.find().lean();

        const daysAgo = (d) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; };
        const daysFromNow = (d) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };

        // ═══════════════════════════════════════
        // 1. BUDGETS — 6 departments
        // ═══════════════════════════════════════
        const budgets = await Budget.insertMany([
            { department: 'General', monthlyLimit: 500000, isActive: true },
            { department: 'Engineering', monthlyLimit: 800000, isActive: true },
            { department: 'Procurement', monthlyLimit: 1200000, isActive: true },
            { department: 'Operations', monthlyLimit: 600000, isActive: true },
            { department: 'Maintenance', monthlyLimit: 350000, isActive: true },
            { department: 'IT Infrastructure', monthlyLimit: 450000, isActive: true },
        ]);
        console.log(`✅ ${budgets.length} budgets created`);

        // ═══════════════════════════════════════
        // 2. CONTRACTS — 8 vendor contracts
        // ═══════════════════════════════════════
        const contractData = [
            {
                vendor: vendors[0]._id, title: 'Annual Steel & Copper Supply Agreement',
                startDate: daysAgo(180), endDate: daysFromNow(185), value: 2500000,
                terms: 'Monthly delivery of steel rods and copper wire. Min order: 50 units. Net 30 payment terms. 2% early payment discount within 10 days.',
                renewalReminder: true,
            },
            {
                vendor: vendors[1]._id, title: 'Aluminum Sheet Procurement Contract',
                startDate: daysAgo(120), endDate: daysFromNow(245), value: 1800000,
                terms: 'Quarterly aluminum sheet supply. Quality: Grade A6061. Free replacement for defective units. FOB Destination.',
                renewalReminder: true,
            },
            {
                vendor: vendors[2]._id, title: 'Construction Materials Framework Agreement',
                startDate: daysAgo(90), endDate: daysFromNow(275), value: 3200000,
                terms: 'Cement, sand, and steel supply for Project Alpha. Delivery within 48hrs of order. Penalty: 1% per day for late delivery.',
                renewalReminder: true,
            },
            {
                vendor: vendors[3]._id, title: 'Chemical Supply SLA',
                startDate: daysAgo(200), endDate: daysFromNow(165), value: 950000,
                terms: 'Industrial solvents and epoxy resin. MSDS documentation required. Temperature-controlled transport mandated.',
                renewalReminder: true,
            },
            {
                vendor: vendors[4]._id, title: 'Electrical Components Contract',
                startDate: daysAgo(150), endDate: daysFromNow(215), value: 1500000,
                terms: 'Circuit breakers, LED panels, and copper wire. ISI certification required. 1-year warranty on all components.',
                renewalReminder: true,
            },
            {
                vendor: vendors[0]._id, title: 'PVC Pipes Spot Purchase Agreement',
                startDate: daysAgo(60), endDate: daysFromNow(305), value: 600000,
                terms: 'On-demand PVC pipe supply. Lead time: 7 business days. BIS certified.',
                renewalReminder: false,
            },
            {
                vendor: vendors[1]._id, title: 'Rubber Gaskets Annual Contract',
                startDate: daysAgo(300), endDate: daysAgo(10), // EXPIRED
                value: 450000,
                terms: 'Monthly gasket supply for production line. Quality: Shore A 60. Expired — pending renewal.',
                renewalReminder: true,
            },
            {
                vendor: vendors[3]._id, title: 'R&D Materials Supply (Pending)',
                startDate: daysFromNow(15), endDate: daysFromNow(380),
                value: 750000,
                terms: 'Specialty chemicals for R&D lab. Subject to regulatory approval.',
                renewalReminder: true,
            },
        ];

        for (const c of contractData) {
            const contract = new Contract(c);
            await contract.save(); // triggers pre-save for auto-status
        }
        console.log(`✅ ${contractData.length} contracts created`);

        // ═══════════════════════════════════════
        // 3. INVENTORY — 12 items
        // ═══════════════════════════════════════
        const inventoryData = [
            { itemName: 'Steel Rods', currentStock: 320, reorderPoint: 100, reorderQty: 200, unitPrice: 450, category: 'Raw Materials', preferredVendor: vendors[0]._id, autoReorder: true },
            { itemName: 'Copper Wire', currentStock: 85, reorderPoint: 50, reorderQty: 100, unitPrice: 820, category: 'Raw Materials', preferredVendor: vendors[0]._id, autoReorder: true },
            { itemName: 'PVC Pipes', currentStock: 450, reorderPoint: 150, reorderQty: 300, unitPrice: 180, category: 'Raw Materials', preferredVendor: vendors[0]._id, autoReorder: false },
            { itemName: 'Aluminum Sheets', currentStock: 25, reorderPoint: 30, reorderQty: 100, unitPrice: 1200, category: 'Raw Materials', preferredVendor: vendors[1]._id, autoReorder: true },  // LOW STOCK!
            { itemName: 'Rubber Gaskets', currentStock: 1200, reorderPoint: 200, reorderQty: 500, unitPrice: 55, category: 'Components', preferredVendor: vendors[1]._id, autoReorder: false },
            { itemName: 'Cement Bags', currentStock: 180, reorderPoint: 100, reorderQty: 300, unitPrice: 380, category: 'Construction', preferredVendor: vendors[2]._id, autoReorder: true },
            { itemName: 'Sand (per ton)', currentStock: 5, reorderPoint: 8, reorderQty: 15, unitPrice: 1500, category: 'Construction', preferredVendor: vendors[2]._id, autoReorder: true },  // LOW STOCK!
            { itemName: 'Industrial Solvents', currentStock: 42, reorderPoint: 15, reorderQty: 30, unitPrice: 650, category: 'Chemicals', preferredVendor: vendors[3]._id, autoReorder: false },
            { itemName: 'Epoxy Resin', currentStock: 8, reorderPoint: 10, reorderQty: 20, unitPrice: 1850, category: 'Chemicals', preferredVendor: vendors[3]._id, autoReorder: true },  // LOW STOCK!
            { itemName: 'Circuit Breakers', currentStock: 60, reorderPoint: 20, reorderQty: 50, unitPrice: 2200, category: 'Electrical', preferredVendor: vendors[4]._id, autoReorder: false },
            { itemName: 'LED Panels', currentStock: 150, reorderPoint: 40, reorderQty: 80, unitPrice: 550, category: 'Electrical', preferredVendor: vendors[4]._id, autoReorder: false },
            { itemName: 'Safety Helmets', currentStock: 3, reorderPoint: 25, reorderQty: 50, unitPrice: 250, category: 'Safety', preferredVendor: vendors[2]._id, autoReorder: true },  // CRITICAL LOW!
        ];

        for (const item of inventoryData) {
            const inv = new Inventory(item);
            await inv.save(); // triggers pre-save for auto-SKU
        }
        console.log(`✅ ${inventoryData.length} inventory items created (4 below reorder point)`);

        // ═══════════════════════════════════════
        // 4. NOTIFICATIONS — 15 realistic alerts
        // ═══════════════════════════════════════
        const notificationData = [
            { user: admin._id, type: 'overdue_invoice', message: `Invoice INV-2025-004 from ${vendors[3].name} is overdue by 5 days. Outstanding: ₹${invoices[3]?.outstandingAmount?.toLocaleString() || '47,250'}`, relatedEntity: { entityType: 'Invoice', entityId: invoices[3]?._id }, read: false },
            { user: admin._id, type: 'overdue_invoice', message: `Invoice INV-2025-008 from ${vendors[3].name} is overdue. Outstanding: ₹${invoices[7]?.outstandingAmount?.toLocaleString() || '82,500'}`, relatedEntity: { entityType: 'Invoice', entityId: invoices[7]?._id }, read: false },
            { user: admin._id, type: 'late_delivery', message: `PO ${pos[2]?.poNumber || 'PO-0003'} from ${vendors[2].name} was delivered 5 days late. Vendor performance may be affected.`, relatedEntity: { entityType: 'PurchaseOrder', entityId: pos[2]?._id }, read: true },
            { user: admin._id, type: 'late_delivery', message: `PO ${pos[4]?.poNumber || 'PO-0005'} from ${vendors[4].name} was delivered 5 days late. Consider discussing SLA terms.`, relatedEntity: { entityType: 'PurchaseOrder', entityId: pos[4]?._id }, read: true },
            { user: admin._id, type: 'po_approved', message: `PO ${pos[0]?.poNumber || 'PO-0001'} for ${vendors[0].name} has been approved and is ready for processing.`, relatedEntity: { entityType: 'PurchaseOrder', entityId: pos[0]?._id }, read: true },
            { user: admin._id, type: 'payment_received', message: `Payment of ₹${invoices[0]?.paidAmount?.toLocaleString() || '86,000'} received for INV-2025-001 from ${vendors[0].name}.`, relatedEntity: { entityType: 'Invoice', entityId: invoices[0]?._id }, read: true },
            { user: admin._id, type: 'budget_exceeded', message: 'Engineering department has reached 92% of monthly budget (₹800,000). Immediate review recommended.', relatedEntity: { entityType: 'Budget' }, read: false },
            { user: admin._id, type: 'overspending', message: `${vendors[2].name} spend is 35% higher than last quarter. Consider renegotiating contract terms.`, relatedEntity: { entityType: 'Vendor', entityId: vendors[2]._id }, read: false },
            { user: admin._id, type: 'info', message: 'Monthly financial report is ready. 8 invoices processed, 6 payments completed, 2 overdue.', read: false },
            { user: admin._id, type: 'info', message: 'System update: Accounting period for January 2026 has been closed by Admin.', read: true },
            { user: manager?._id || admin._id, type: 'po_approved', message: `PO ${pos[1]?.poNumber || 'PO-0002'} approved. ${vendors[1].name} has been notified.`, relatedEntity: { entityType: 'PurchaseOrder', entityId: pos[1]?._id }, read: false },
            { user: manager?._id || admin._id, type: 'late_delivery', message: `PO ${pos[6]?.poNumber || 'PO-0007'} from ${vendors[1].name} is 2 days past expected delivery.`, relatedEntity: { entityType: 'PurchaseOrder', entityId: pos[6]?._id }, read: false },
            { user: accountant?._id || admin._id, type: 'overdue_invoice', message: `3 invoices are approaching due date within next 5 days. Total outstanding: ₹1,82,500.`, read: false },
            { user: accountant?._id || admin._id, type: 'payment_received', message: `Batch payment of ₹2,40,000 processed for ${vendors[1].name}. Invoice fully settled.`, read: true },
            { user: accountant?._id || admin._id, type: 'info', message: 'Tax report for Q4 is available. Total GST liability: ₹1,24,350.', read: false },
        ];
        await Notification.insertMany(notificationData.filter(n => n.relatedEntity?.entityId || !n.relatedEntity?.entityId));
        console.log(`✅ ${notificationData.length} notifications created`);

        // ═══════════════════════════════════════
        // 5. AUDIT LOGS — 20 activity traces
        // ═══════════════════════════════════════
        const auditData = [
            { user: admin._id, action: 'CREATE', entityType: 'Vendor', entityId: vendors[0]._id, metadata: { name: vendors[0].name } },
            { user: admin._id, action: 'CREATE', entityType: 'Vendor', entityId: vendors[1]._id, metadata: { name: vendors[1].name } },
            { user: admin._id, action: 'CREATE', entityType: 'Vendor', entityId: vendors[2]._id, metadata: { name: vendors[2].name } },
            { user: admin._id, action: 'CREATE', entityType: 'Vendor', entityId: vendors[3]._id, metadata: { name: vendors[3].name } },
            { user: admin._id, action: 'CREATE', entityType: 'Vendor', entityId: vendors[4]._id, metadata: { name: vendors[4].name } },
            { user: admin._id, action: 'CREATE', entityType: 'PurchaseOrder', entityId: pos[0]._id, metadata: { poNumber: pos[0].poNumber, vendor: vendors[0].name } },
            { user: admin._id, action: 'CREATE', entityType: 'PurchaseOrder', entityId: pos[1]._id, metadata: { poNumber: pos[1].poNumber, vendor: vendors[1].name } },
            { user: admin._id, action: 'APPROVE', entityType: 'PurchaseOrder', entityId: pos[0]._id, metadata: { poNumber: pos[0].poNumber, action: 'Approved' } },
            { user: manager?._id || admin._id, action: 'APPROVE', entityType: 'PurchaseOrder', entityId: pos[1]._id, metadata: { poNumber: pos[1].poNumber, action: 'Approved' } },
            { user: admin._id, action: 'DELIVERY', entityType: 'PurchaseOrder', entityId: pos[0]._id, metadata: { poNumber: pos[0].poNumber, deliveredOn: daysAgo(44).toISOString() } },
            { user: admin._id, action: 'DELIVERY', entityType: 'PurchaseOrder', entityId: pos[2]._id, metadata: { poNumber: pos[2].poNumber, lateDelivery: true, dayslate: 5 } },
            { user: admin._id, action: 'CREATE', entityType: 'Invoice', entityId: invoices[0]._id, metadata: { invoiceNumber: invoices[0].invoiceNumber, amount: invoices[0].amount } },
            { user: admin._id, action: 'CREATE', entityType: 'Invoice', entityId: invoices[1]._id, metadata: { invoiceNumber: invoices[1].invoiceNumber, amount: invoices[1].amount } },
            { user: admin._id, action: 'CREATE', entityType: 'Invoice', entityId: invoices[2]._id, metadata: { invoiceNumber: invoices[2].invoiceNumber, amount: invoices[2].amount } },
            { user: accountant?._id || admin._id, action: 'PAYMENT', entityType: 'Invoice', entityId: invoices[0]._id, metadata: { invoiceNumber: invoices[0].invoiceNumber, paidAmount: invoices[0].paidAmount, method: 'Bank Transfer' } },
            { user: accountant?._id || admin._id, action: 'PAYMENT', entityType: 'Invoice', entityId: invoices[1]._id, metadata: { invoiceNumber: invoices[1].invoiceNumber, paidAmount: invoices[1].paidAmount, method: 'Stripe' } },
            { user: admin._id, action: 'UPDATE', entityType: 'Vendor', entityId: vendors[0]._id, metadata: { field: 'earlyPaymentDiscount', oldValue: 0, newValue: 2 } },
            { user: admin._id, action: 'CREATE', entityType: 'Budget', entityId: budgets[0]._id, metadata: { department: 'General', limit: 500000 } },
            { user: admin._id, action: 'CREATE', entityType: 'Budget', entityId: budgets[1]._id, metadata: { department: 'Engineering', limit: 800000 } },
            { user: admin._id, action: 'UPDATE', entityType: 'User', entityId: manager?._id || admin._id, metadata: { action: 'Password reset by Admin' } },
        ];
        await AuditLog.insertMany(auditData);
        console.log(`✅ ${auditData.length} audit log entries created`);

        // ═══════════════════════════════════════
        // 6. WEBHOOKS — 3 endpoints
        // ═══════════════════════════════════════
        await Webhook.insertMany([
            {
                name: 'Slack PO Notifications',
                url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX',
                events: ['po_created', 'po_approved', 'po_rejected'],
                secret: 'whsec_slack_demo_secret_key_2026',
                isActive: true,
            },
            {
                name: 'Accounting System Sync',
                url: 'https://erp.example.com/api/webhooks/vendor-system',
                events: ['invoice_paid', 'budget_exceeded'],
                secret: 'whsec_erp_sync_key_abc123',
                isActive: true,
                lastTriggered: daysAgo(2),
            },
            {
                name: 'Delivery Monitoring',
                url: 'https://logistics.example.com/hooks/delivery-alert',
                events: ['delivery_late', 'vendor_created'],
                secret: 'whsec_logistics_hook_xyz',
                isActive: false,
                failCount: 3,
            },
        ]);
        console.log('✅ 3 webhooks created');

        // ── Summary ──
        console.log('\n' + '═'.repeat(50));
        console.log('  ✅  EXTRA DATA SEED COMPLETE');
        console.log('═'.repeat(50));
        console.log(`  Budgets:        ${budgets.length} departments`);
        console.log(`  Contracts:      ${contractData.length} (5 active, 1 expired, 1 pending, 1 active)`);
        console.log(`  Inventory:      ${inventoryData.length} items (4 below reorder point)`);
        console.log(`  Notifications:  ${notificationData.length} alerts`);
        console.log(`  Audit Logs:     ${auditData.length} entries`);
        console.log(`  Webhooks:       3 endpoints`);
        console.log('═'.repeat(50));
        console.log('  Login: admin@vendor.com / admin123');
        console.log('═'.repeat(50) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedExtra();
