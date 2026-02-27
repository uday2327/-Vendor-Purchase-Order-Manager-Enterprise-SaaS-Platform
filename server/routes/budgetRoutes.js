const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');

router.use(protect);

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: Get all budgets with spend data
 *     tags: [Budgets]
 */
router.get('/', authorize('admin', 'manager', 'accountant', 'viewer'), getBudgets);

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Create a department budget
 *     tags: [Budgets]
 */
router.post('/', authorize('admin'), createBudget);
router.put('/:id', authorize('admin'), updateBudget);
router.delete('/:id', authorize('admin'), deleteBudget);

module.exports = router;
