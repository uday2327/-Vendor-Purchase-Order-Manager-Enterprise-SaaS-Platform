const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getContracts, createContract, updateContract, deleteContract } = require('../controllers/contractController');

router.use(protect);

router.get('/', authorize('admin', 'manager', 'viewer'), getContracts);
router.post('/', authorize('admin', 'manager'), createContract);
router.put('/:id', authorize('admin', 'manager'), updateContract);
router.delete('/:id', authorize('admin'), deleteContract);

module.exports = router;
