const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const PurchaseOrder = require('./models/PurchaseOrder');
const Invoice = require('./models/Invoice');

dotenv.config();

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
};

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Vendor.deleteMany();
        await PurchaseOrder.deleteMany();
        await Invoice.deleteMany();

        console.log('Cleared existing data...');

        // Create users for each role
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@vendor.com',
            password: 'admin123',
            role: 'admin',
        });
        const manager = await User.create({
            name: 'Manager',
            email: 'manager@vendor.com',
            password: 'manager123',
            role: 'manager',
        });
        const accountant = await User.create({
            name: 'Accountant',
            email: 'accountant@vendor.com',
            password: 'accountant123',
            role: 'accountant',
        });
        const viewer = await User.create({
            name: 'Viewer',
            email: 'viewer@vendor.com',
            password: 'viewer123',
            role: 'viewer',
        });
        console.log('Users created:');
        console.log('  admin@vendor.com / admin123 (admin)');
        console.log('  manager@vendor.com / manager123 (manager)');
        console.log('  accountant@vendor.com / accountant123 (accountant)');
        console.log('  viewer@vendor.com / viewer123 (viewer)');

        // Create vendors
        const vendors = await Vendor.insertMany([
            {
                name: 'Apex Industrial Supplies',
                contactPerson: 'Rajesh Kumar',
                phone: '+91-9876543210',
                email: 'rajesh@apexsupplies.com',
                address: '45 Industrial Area, Phase 2, Pune 411018',
                gstTaxId: '27AABCU9603R1ZP',
                rating: 4.5,
                performanceScore: 88,
                itemPrices: [
                    { itemName: 'Steel Rods', unitPrice: 450 },
                    { itemName: 'Copper Wire', unitPrice: 820 },
                    { itemName: 'PVC Pipes', unitPrice: 180 },
                ],
            },
            {
                name: 'GreenTech Materials',
                contactPerson: 'Priya Sharma',
                phone: '+91-9876543211',
                email: 'priya@greentech.com',
                address: '12 MIDC, Andheri East, Mumbai 400093',
                gstTaxId: '27AADCG5678H1ZQ',
                rating: 4.2,
                performanceScore: 82,
                itemPrices: [
                    { itemName: 'Steel Rods', unitPrice: 470 },
                    { itemName: 'Aluminum Sheets', unitPrice: 1200 },
                    { itemName: 'Rubber Gaskets', unitPrice: 55 },
                ],
            },
            {
                name: 'ProBuild Hardware',
                contactPerson: 'Amit Patel',
                phone: '+91-9876543212',
                email: 'amit@probuild.in',
                address: '78 Gandhi Nagar, Ahmedabad 380015',
                gstTaxId: '24AAECR1234K1ZF',
                rating: 3.8,
                performanceScore: 74,
                itemPrices: [
                    { itemName: 'Cement Bags', unitPrice: 380 },
                    { itemName: 'Steel Rods', unitPrice: 440 },
                    { itemName: 'Sand (per ton)', unitPrice: 1500 },
                ],
            },
            {
                name: 'NovaChem Industries',
                contactPerson: 'Deepika Reddy',
                phone: '+91-9876543213',
                email: 'deepika@novachem.com',
                address: '90 Jubilee Hills, Hyderabad 500033',
                gstTaxId: '36AABCN7890P1ZA',
                rating: 4.7,
                performanceScore: 92,
                itemPrices: [
                    { itemName: 'Industrial Solvents', unitPrice: 650 },
                    { itemName: 'Epoxy Resin', unitPrice: 1850 },
                    { itemName: 'PVC Pipes', unitPrice: 165 },
                ],
            },
            {
                name: 'SafeGuard Electricals',
                contactPerson: 'Vikram Singh',
                phone: '+91-9876543214',
                email: 'vikram@safeguard.co.in',
                address: '34 Sector 62, Noida 201301',
                gstTaxId: '09AADCS5432M1ZR',
                rating: 3.5,
                performanceScore: 68,
                itemPrices: [
                    { itemName: 'Copper Wire', unitPrice: 790 },
                    { itemName: 'Circuit Breakers', unitPrice: 2200 },
                    { itemName: 'LED Panels', unitPrice: 550 },
                ],
            },
        ]);
        console.log(`${vendors.length} vendors created`);

        // Helper to create dates
        const daysAgo = (days) => {
            const d = new Date();
            d.setDate(d.getDate() - days);
            return d;
        };
        const daysFromNow = (days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return d;
        };

        // Create purchase orders (save one at a time to trigger pre-save hooks)
        const poData = [
            {
                vendor: vendors[0]._id,
                items: [
                    { name: 'Steel Rods', qty: 100, unitPrice: 450 },
                    { name: 'Copper Wire', qty: 50, unitPrice: 820 },
                ],
                orderDate: daysAgo(60),
                expectedDeliveryDate: daysAgo(45),
                actualDeliveryDate: daysAgo(44),
                status: 'Delivered',
            },
            {
                vendor: vendors[1]._id,
                items: [
                    { name: 'Aluminum Sheets', qty: 200, unitPrice: 1200 },
                ],
                orderDate: daysAgo(55),
                expectedDeliveryDate: daysAgo(40),
                actualDeliveryDate: daysAgo(38),
                status: 'Delivered',
            },
            {
                vendor: vendors[2]._id,
                items: [
                    { name: 'Cement Bags', qty: 500, unitPrice: 380 },
                    { name: 'Sand (per ton)', qty: 10, unitPrice: 1500 },
                ],
                orderDate: daysAgo(50),
                expectedDeliveryDate: daysAgo(35),
                actualDeliveryDate: daysAgo(30), // late
                status: 'Delivered',
            },
            {
                vendor: vendors[3]._id,
                items: [
                    { name: 'Industrial Solvents', qty: 30, unitPrice: 650 },
                    { name: 'Epoxy Resin', qty: 15, unitPrice: 1850 },
                ],
                orderDate: daysAgo(45),
                expectedDeliveryDate: daysAgo(30),
                actualDeliveryDate: daysAgo(31),
                status: 'Delivered',
            },
            {
                vendor: vendors[4]._id,
                items: [
                    { name: 'Circuit Breakers', qty: 25, unitPrice: 2200 },
                    { name: 'LED Panels', qty: 100, unitPrice: 550 },
                ],
                orderDate: daysAgo(40),
                expectedDeliveryDate: daysAgo(25),
                actualDeliveryDate: daysAgo(20), // late
                status: 'Delivered',
            },
            {
                vendor: vendors[0]._id,
                items: [
                    { name: 'PVC Pipes', qty: 300, unitPrice: 180 },
                ],
                orderDate: daysAgo(30),
                expectedDeliveryDate: daysAgo(15),
                actualDeliveryDate: daysAgo(16),
                status: 'Delivered',
            },
            {
                vendor: vendors[1]._id,
                items: [
                    { name: 'Rubber Gaskets', qty: 1000, unitPrice: 55 },
                    { name: 'Steel Rods', qty: 80, unitPrice: 470 },
                ],
                orderDate: daysAgo(25),
                expectedDeliveryDate: daysAgo(10),
                actualDeliveryDate: daysAgo(8), // late
                status: 'Delivered',
            },
            {
                vendor: vendors[3]._id,
                items: [
                    { name: 'PVC Pipes', qty: 500, unitPrice: 165 },
                ],
                orderDate: daysAgo(20),
                expectedDeliveryDate: daysAgo(5),
                actualDeliveryDate: daysAgo(6),
                status: 'Delivered',
            },
            {
                vendor: vendors[0]._id,
                items: [
                    { name: 'Steel Rods', qty: 150, unitPrice: 450 },
                    { name: 'Copper Wire', qty: 75, unitPrice: 820 },
                ],
                orderDate: daysAgo(15),
                expectedDeliveryDate: daysFromNow(5),
                status: 'Pending',
            },
            {
                vendor: vendors[2]._id,
                items: [
                    { name: 'Cement Bags', qty: 300, unitPrice: 380 },
                ],
                orderDate: daysAgo(10),
                expectedDeliveryDate: daysFromNow(10),
                status: 'Pending',
            },
            {
                vendor: vendors[4]._id,
                items: [
                    { name: 'Copper Wire', qty: 100, unitPrice: 790 },
                    { name: 'LED Panels', qty: 50, unitPrice: 550 },
                ],
                orderDate: daysAgo(8),
                expectedDeliveryDate: daysFromNow(12),
                status: 'Pending',
            },
            {
                vendor: vendors[3]._id,
                items: [
                    { name: 'Epoxy Resin', qty: 20, unitPrice: 1850 },
                ],
                orderDate: daysAgo(5),
                expectedDeliveryDate: daysFromNow(15),
                status: 'Pending',
            },
            {
                vendor: vendors[1]._id,
                items: [
                    { name: 'Aluminum Sheets', qty: 100, unitPrice: 1200 },
                ],
                orderDate: daysAgo(60),
                expectedDeliveryDate: daysAgo(50),
                status: 'Cancelled',
            },
            {
                vendor: vendors[0]._id,
                items: [
                    { name: 'Steel Rods', qty: 200, unitPrice: 450 },
                ],
                orderDate: daysAgo(90),
                expectedDeliveryDate: daysAgo(75),
                actualDeliveryDate: daysAgo(74),
                status: 'Delivered',
                isRecurring: true,
                recurringInterval: 'Monthly',
            },
            {
                vendor: vendors[2]._id,
                items: [
                    { name: 'Cement Bags', qty: 200, unitPrice: 380 },
                    { name: 'Steel Rods', qty: 50, unitPrice: 440 },
                ],
                orderDate: daysAgo(3),
                expectedDeliveryDate: daysFromNow(20),
                status: 'Pending',
            },
        ];

        const purchaseOrders = [];
        for (const data of poData) {
            const po = new PurchaseOrder(data);
            await po.save();
            purchaseOrders.push(po);
        }
        console.log(`${purchaseOrders.length} purchase orders created`);

        // Create invoices
        const deliveredPOs = purchaseOrders.filter(
            (po) => po.status === 'Delivered'
        );

        const invoiceData = [
            {
                purchaseOrder: deliveredPOs[0]._id,
                vendor: deliveredPOs[0].vendor,
                invoiceNumber: 'INV-2025-001',
                amount: deliveredPOs[0].totalAmount,
                paidAmount: deliveredPOs[0].totalAmount,
                dueDate: daysAgo(30),
            },
            {
                purchaseOrder: deliveredPOs[1]._id,
                vendor: deliveredPOs[1].vendor,
                invoiceNumber: 'INV-2025-002',
                amount: deliveredPOs[1].totalAmount,
                paidAmount: deliveredPOs[1].totalAmount,
                dueDate: daysAgo(25),
            },
            {
                purchaseOrder: deliveredPOs[2]._id,
                vendor: deliveredPOs[2].vendor,
                invoiceNumber: 'INV-2025-003',
                amount: deliveredPOs[2].totalAmount,
                paidAmount: 100000,
                dueDate: daysAgo(10),
            },
            {
                purchaseOrder: deliveredPOs[3]._id,
                vendor: deliveredPOs[3].vendor,
                invoiceNumber: 'INV-2025-004',
                amount: deliveredPOs[3].totalAmount,
                paidAmount: 0,
                dueDate: daysAgo(5), // overdue
            },
            {
                purchaseOrder: deliveredPOs[4]._id,
                vendor: deliveredPOs[4].vendor,
                invoiceNumber: 'INV-2025-005',
                amount: deliveredPOs[4].totalAmount,
                paidAmount: 50000,
                dueDate: daysFromNow(5),
            },
            {
                purchaseOrder: deliveredPOs[5]._id,
                vendor: deliveredPOs[5].vendor,
                invoiceNumber: 'INV-2025-006',
                amount: deliveredPOs[5].totalAmount,
                paidAmount: 0,
                dueDate: daysFromNow(15),
            },
            {
                purchaseOrder: deliveredPOs[6]._id,
                vendor: deliveredPOs[6].vendor,
                invoiceNumber: 'INV-2025-007',
                amount: deliveredPOs[6].totalAmount,
                paidAmount: deliveredPOs[6].totalAmount,
                dueDate: daysAgo(2),
            },
            {
                purchaseOrder: deliveredPOs[7]._id,
                vendor: deliveredPOs[7].vendor,
                invoiceNumber: 'INV-2025-008',
                amount: deliveredPOs[7].totalAmount,
                paidAmount: 0,
                dueDate: daysAgo(1), // overdue
            },
            {
                purchaseOrder: deliveredPOs.length > 8 ? deliveredPOs[8]._id : deliveredPOs[0]._id,
                vendor: deliveredPOs.length > 8 ? deliveredPOs[8].vendor : deliveredPOs[0].vendor,
                invoiceNumber: 'INV-2025-009',
                amount: 90000,
                paidAmount: 45000,
                dueDate: daysFromNow(10),
            },
            {
                purchaseOrder: deliveredPOs.length > 8 ? deliveredPOs[8]._id : deliveredPOs[1]._id,
                vendor: deliveredPOs.length > 8 ? deliveredPOs[8].vendor : deliveredPOs[1].vendor,
                invoiceNumber: 'INV-2025-010',
                amount: 75000,
                paidAmount: 75000,
                dueDate: daysAgo(15),
            },
        ];

        for (const data of invoiceData) {
            const inv = new Invoice(data);
            await inv.save();
        }
        console.log('10 invoices created');

        console.log('\n✅ Seed complete!');
        console.log('Login with: admin@vendor.com / admin123');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedData();
