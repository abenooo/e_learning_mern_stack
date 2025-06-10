const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getChecklistItems,
  getChecklistItem,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem
} = require('../controllers/checklistItems');

// Get all checklist items
router.get('/', getChecklistItems);

// Get single checklist item
router.get('/:id', getChecklistItem);

// Create checklist item
router.post(
  '/',
  [
    protect,
    checkPermission('checklist_items', 'create'),
    check('checklist', 'Checklist ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('order_number', 'Order number is required').isNumeric()
  ],
  createChecklistItem
);

// Update checklist item
router.put(
  '/:id',
  [
    protect,
    checkPermission('checklist_items', 'update'),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('order_number', 'Order number must be numeric').optional().isNumeric()
  ],
  updateChecklistItem
);

// Delete checklist item
router.delete(
  '/:id',
  [
    protect,
    checkPermission('checklist_items', 'delete')
  ],
  deleteChecklistItem
);

module.exports = router; 