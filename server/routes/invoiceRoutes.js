const express = require('express');
const router = express.Router();
const {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    uploadInvoiceFile,
    recordPayment,
    upload,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { generateInvoicePdf } = require('../controllers/pdfController');

router.use(protect);

// Read endpoints — admin, accountant, viewer
router.get('/', authorize('admin', 'accountant', 'viewer'), getInvoices);
router.get('/:id', authorize('admin', 'accountant', 'viewer'), getInvoice);

// Write endpoints — admin + accountant only
router.post('/', authorize('admin', 'accountant'), createInvoice);
router.put('/:id', authorize('admin', 'accountant'), updateInvoice);
router.delete('/:id', authorize('admin', 'accountant'), deleteInvoice);
router.post('/:id/upload', authorize('admin', 'accountant'), upload.single('invoiceFile'), uploadInvoiceFile);
router.put('/:id/pay', authorize('admin', 'accountant'), recordPayment);

// PDF
router.get('/:id/pdf', authorize('admin', 'accountant', 'viewer'), generateInvoicePdf);

module.exports = router;
