const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    closePeriod, reopenPeriod, getPeriods,
    getTaxReport, getInvoiceExceptions,
    getVendorAging, getCurrencySummary,
    createBatchPayment, createAccrual, reverseAccrual, getAccruals,
    archiveRecord,
} = require('../controllers/accountingController');

router.use(protect);

// Accounting periods
router.get('/periods', authorize('admin', 'accountant'), getPeriods);
router.post('/close-period', authorize('admin'), closePeriod);
router.post('/reopen-period', authorize('admin'), reopenPeriod);

// Tax & currency
router.get('/tax-report', authorize('admin', 'accountant'), getTaxReport);
router.get('/currency-summary', authorize('admin', 'accountant', 'manager'), getCurrencySummary);

// 3-way matching exceptions
router.get('/invoice-exceptions', authorize('admin', 'accountant', 'manager'), getInvoiceExceptions);

// Vendor aging
router.get('/vendor-aging', authorize('admin', 'accountant', 'manager'), getVendorAging);

// Batch payments
router.post('/batch-payment', authorize('admin', 'accountant'), createBatchPayment);

// Accruals
router.get('/accruals', authorize('admin', 'accountant'), getAccruals);
router.post('/accruals', authorize('admin', 'accountant'), createAccrual);
router.post('/accruals/:id/reverse', authorize('admin', 'accountant'), reverseAccrual);

// Archive
router.post('/archive/:model/:id', authorize('admin'), archiveRecord);

module.exports = router;
