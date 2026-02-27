const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { exportVendors, exportPurchaseOrders, exportInvoices, exportAuditLogs } = require('../controllers/exportController');

router.use(protect);

router.get('/vendors', authorize('admin', 'manager'), exportVendors);
router.get('/purchase-orders', authorize('admin', 'manager'), exportPurchaseOrders);
router.get('/invoices', authorize('admin', 'accountant'), exportInvoices);
router.get('/audit-logs', authorize('admin'), exportAuditLogs);

module.exports = router;
