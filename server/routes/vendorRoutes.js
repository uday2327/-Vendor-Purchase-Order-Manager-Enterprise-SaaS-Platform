const express = require('express');
const router = express.Router();
const {
    getVendors,
    getVendor,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorPerformance,
    getVendorOrders,
    compareVendorPrices,
    suggestBestVendor,
} = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');
const { authorize, readAllWriteFor } = require('../middleware/rbac');

router.use(protect);

// Read endpoints — admin, manager, viewer, accountant can read
router.get('/compare-prices', authorize('admin', 'manager', 'viewer', 'accountant'), compareVendorPrices);
router.get('/suggest', authorize('admin', 'manager', 'viewer', 'accountant'), suggestBestVendor);
router.get('/', authorize('admin', 'manager', 'viewer', 'accountant'), getVendors);
router.get('/:id', authorize('admin', 'manager', 'viewer', 'accountant'), getVendor);
router.get('/:id/performance', authorize('admin', 'manager', 'viewer', 'accountant'), getVendorPerformance);
router.get('/:id/orders', authorize('admin', 'manager', 'viewer', 'accountant'), getVendorOrders);

// Write endpoints — admin + manager only
router.post('/', authorize('admin', 'manager'), createVendor);
router.put('/:id', authorize('admin', 'manager'), updateVendor);
router.delete('/:id', authorize('admin', 'manager'), deleteVendor);

module.exports = router;
