const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getCashFlow } = require('../controllers/financeController');

router.use(protect);

router.get('/cash-flow', authorize('admin', 'accountant', 'manager'), getCashFlow);

module.exports = router;
