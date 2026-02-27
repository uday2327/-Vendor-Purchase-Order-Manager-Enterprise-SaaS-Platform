const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getPayments, createPayment, approvePayment, getVendorLedger } = require('../controllers/paymentController');

router.use(protect);

router.get('/', authorize('admin', 'accountant', 'manager'), getPayments);
router.post('/', authorize('admin', 'accountant'), createPayment);
router.post('/:id/approve', authorize('admin', 'manager'), approvePayment);
router.get('/vendor/:vendorId/ledger', authorize('admin', 'accountant', 'manager'), getVendorLedger);

module.exports = router;
