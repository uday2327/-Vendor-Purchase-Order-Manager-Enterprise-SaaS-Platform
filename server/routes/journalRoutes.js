const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getJournalEntries, getAccounts } = require('../controllers/journalController');

router.use(protect);

router.get('/', authorize('admin', 'accountant'), getJournalEntries);
router.get('/accounts', authorize('admin', 'accountant'), getAccounts);

module.exports = router;
