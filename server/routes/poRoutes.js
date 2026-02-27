const express = require('express');
const router = express.Router();
const {
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    updateDeliveryStatus,
    overspendingCheck,
} = require('../controllers/poController');
const { submitPO, approvePO, rejectPO } = require('../controllers/approvalController');
const { generatePOPdf } = require('../controllers/pdfController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Read endpoints — admin, manager, viewer, accountant
router.get('/', authorize('admin', 'manager', 'viewer', 'accountant'), getPurchaseOrders);
router.get('/:id', authorize('admin', 'manager', 'viewer', 'accountant'), getPurchaseOrder);

// Write endpoints — admin + manager only
router.post('/', authorize('admin', 'manager'), createPurchaseOrder);
router.put('/:id', authorize('admin', 'manager'), updatePurchaseOrder);
router.delete('/:id', authorize('admin', 'manager'), deletePurchaseOrder);
router.put('/:id/delivery', authorize('admin', 'manager'), updateDeliveryStatus);
router.post('/overspending-check', authorize('admin', 'manager'), overspendingCheck);

// Approval workflow
router.post('/:id/submit', authorize('admin', 'manager'), submitPO);
router.post('/:id/approve', authorize('admin', 'manager'), approvePO);
router.post('/:id/reject', authorize('admin', 'manager'), rejectPO);

// PDF
router.get('/:id/pdf', authorize('admin', 'manager', 'viewer'), generatePOPdf);

module.exports = router;
