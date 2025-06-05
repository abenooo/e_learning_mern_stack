const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getPhases,
  getPhase,
  createPhase,
  updatePhase,
  deletePhase
} = require('../controllers/phases');

// Get all phases
router.get('/', getPhases);

// Get single phase
router.get('/:id', getPhase);

// Create phase
router.post(
  '/',
  [
    protect,
    checkPermission('phases', 'create'),
    check('batch_course', 'Batch course ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('order_number', 'Order number is required').isNumeric(),
    check('start_date', 'Invalid start date').optional().isISO8601(),
    check('end_date', 'Invalid end date').optional().isISO8601()
  ],
  createPhase
);

// Update phase
router.put(
  '/:id',
  [
    protect,
    checkPermission('phases', 'update'),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('order_number', 'Order number must be numeric').optional().isNumeric(),
    check('start_date', 'Invalid start date').optional().isISO8601(),
    check('end_date', 'Invalid end date').optional().isISO8601()
  ],
  updatePhase
);

// Delete phase
router.delete(
  '/:id',
  [
    protect,
    checkPermission('phases', 'delete')
  ],
  deletePhase
);

module.exports = router;
