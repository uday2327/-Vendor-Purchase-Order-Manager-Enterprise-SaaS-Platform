const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getPaymentAging, getVendorSpend, getMonthlyGrowth, getVendorReliability } = require('../controllers/analyticsController');
const { getSpendForecast, getAnomalies } = require('../controllers/forecastController');
const { getComplianceReport } = require('../controllers/complianceController');

router.get('/payment-aging', protect, authorize('admin', 'manager', 'accountant'), getPaymentAging);
router.get('/vendor-spend', protect, authorize('admin', 'manager', 'accountant'), getVendorSpend);
router.get('/monthly-growth', protect, authorize('admin', 'manager', 'accountant'), getMonthlyGrowth);
router.get('/vendor-reliability', protect, authorize('admin', 'manager', 'accountant'), getVendorReliability);
router.get('/forecast', protect, authorize('admin', 'manager', 'accountant'), getSpendForecast);
router.get('/anomalies', protect, authorize('admin', 'manager', 'accountant'), getAnomalies);
router.get('/compliance', protect, authorize('admin'), getComplianceReport);

module.exports = router;

