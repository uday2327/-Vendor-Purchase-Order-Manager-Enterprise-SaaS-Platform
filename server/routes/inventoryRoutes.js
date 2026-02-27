const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } = require('../controllers/inventoryController');

router.use(protect);

router.get('/', authorize('admin', 'manager', 'viewer'), getInventory);
router.post('/', authorize('admin', 'manager'), createInventoryItem);
router.put('/:id', authorize('admin', 'manager'), updateInventoryItem);
router.delete('/:id', authorize('admin'), deleteInventoryItem);

module.exports = router;
