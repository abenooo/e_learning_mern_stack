const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getChecklists,
  getChecklist,
  createChecklist,
  updateChecklist,
  deleteChecklist
} = require('../controllers/checklists');

// Get all checklists
router.get('/', getChecklists);

// Get single checklist
router.get('/:id', getChecklist);

// Create checklist
router.post(
  '/',
  [
    protect,
    checkPermission('checklists', 'create'),
    check('class', 'Class ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty()
  ],
  createChecklist
);

// Update checklist
router.put(
  '/:id',
  [
    protect,
    checkPermission('checklists', 'update'),
    check('title', 'Title is required').optional().not().isEmpty()
  ],
  updateChecklist
);

// Delete checklist
router.delete(
  '/:id',
  [
    protect,
    checkPermission('checklists', 'delete')
  ],
  deleteChecklist
);

module.exports = router; 