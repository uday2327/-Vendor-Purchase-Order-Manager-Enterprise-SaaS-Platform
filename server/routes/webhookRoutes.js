const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getWebhooks, createWebhook, updateWebhook, deleteWebhook } = require('../controllers/webhookController');

router.use(protect, authorize('admin'));

router.get('/', getWebhooks);
router.post('/', createWebhook);
router.put('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);

module.exports = router;
