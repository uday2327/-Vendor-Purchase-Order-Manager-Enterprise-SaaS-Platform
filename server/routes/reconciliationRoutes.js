const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { uploadBankStatement, uploadMiddleware } = require('../controllers/reconciliationController');

router.use(protect, authorize('admin', 'accountant'));

router.post('/upload-bank-statement', uploadMiddleware, uploadBankStatement);

module.exports = router;
