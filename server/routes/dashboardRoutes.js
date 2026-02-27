const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Dashboard — all roles can view
router.get('/', protect, authorize('admin', 'manager', 'accountant', 'viewer'), getDashboardStats);

module.exports = router;
