const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { importVendors, upload } = require('../controllers/csvImportController');

/**
 * @swagger
 * /import/vendors:
 *   post:
 *     summary: Import vendors from CSV
 *     tags: [Import]
 */
router.post('/vendors', protect, authorize('admin'), upload.single('file'), importVendors);

module.exports = router;
