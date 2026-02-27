const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getAuditLogs, getEntityTimeline } = require('../controllers/auditController');

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Get audit logs (admin only)
 *     tags: [Audit Logs]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', protect, authorize('admin'), getAuditLogs);

/**
 * @swagger
 * /audit-logs/{entityType}/{id}/timeline:
 *   get:
 *     summary: Get activity timeline for an entity
 *     tags: [Audit Logs]
 */
router.get('/:entityType/:id/timeline', protect, getEntityTimeline);

module.exports = router;
