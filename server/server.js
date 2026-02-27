const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const cron = require('node-cron');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { generateNotifications } = require('./controllers/notificationController');
const { checkReorderPoints } = require('./controllers/inventoryController');

// Load env vars (check root, then server dir)
const fs = require('fs');
const rootEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
} else {
    dotenv.config();
}

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new SocketServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`[Socket] Client disconnected: ${socket.id}`));
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Vendor & PO Manager API Docs',
}));

// ── Routes ──
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/purchase-orders', require('./routes/poRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/import', require('./routes/importRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/adjustments', require('./routes/adjustmentRoutes'));
app.use('/api/reconciliation', require('./routes/reconciliationRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/journal-entries', require('./routes/journalRoutes'));
app.use('/api/accounting', require('./routes/accountingRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '5.0.0' });
});

// ── Serve React build in production ──
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    });
} else {
    // Error middleware (dev only — production serves index.html for all non-API routes)
    app.use(notFound);
    app.use(errorHandler);
}

// ── Cron Jobs ──

// Notifications every hour
cron.schedule('0 * * * *', () => {
    console.log('[Cron] Running notification generation...');
    generateNotifications();
});

// Recurring PO every day at midnight
const PurchaseOrder = require('./models/PurchaseOrder');
const { logAudit } = require('./utils/auditLogger');
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('[Cron] Checking recurring POs...');
        const recurringPOs = await PurchaseOrder.find({ isRecurring: true, recurringInterval: { $ne: 'None' }, status: 'Delivered' }).lean();
        for (const po of recurringPOs) {
            const intervalDays = { Weekly: 7, Monthly: 30, Quarterly: 90 };
            const daysSinceOrder = Math.floor((Date.now() - new Date(po.orderDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceOrder >= (intervalDays[po.recurringInterval] || 999)) {
                const newPO = new PurchaseOrder({
                    vendor: po.vendor, items: po.items,
                    expectedDeliveryDate: new Date(Date.now() + (intervalDays[po.recurringInterval] || 30) * 24 * 60 * 60 * 1000),
                    isRecurring: true, recurringInterval: po.recurringInterval,
                    parentRecurringId: po._id, department: po.department, organizationId: po.organizationId,
                });
                await newPO.save();
                await logAudit(null, 'AUTO_GENERATE', 'PurchaseOrder', newPO._id, { parentPO: po.poNumber, interval: po.recurringInterval });
            }
        }
    } catch (err) { console.error('[Cron] Recurring PO error:', err.message); }
});

// Inventory auto-reorder check every 6 hours
cron.schedule('0 */6 * * *', () => {
    console.log('[Cron] Checking inventory reorder points...');
    checkReorderPoints();
});

// Payment scheduling — process due payments every hour
const { processScheduledPayments } = require('./controllers/paymentController');
cron.schedule('30 * * * *', () => {
    console.log('[Cron] Processing scheduled payments...');
    processScheduledPayments();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Docs: http://localhost:${PORT}/api/docs`);
});
