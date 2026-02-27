const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createAdjustment, getAdjustments } = require('../controllers/adjustmentController');

router.use(protect);

router.get('/', authorize('admin', 'accountant', 'manager'), getAdjustments);
router.post('/', authorize('admin', 'accountant'), createAdjustment);

module.exports = router;
