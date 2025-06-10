const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getWeeks,
  getWeek,
  createWeek,
  updateWeek,
  deleteWeek
} = require('../controllers/weeks');

// Get all weeks
router.get('/', getWeeks);

// Get single week
router.get('/:id', getWeek);

// Create week
router.post(
  '/',
  [
    protect,
    checkPermission('weeks', 'create'),
    check('phase', 'Phase ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('order_number', 'Order number is required').isNumeric()
  ],
  createWeek
);

// Update week
router.put(
  '/:id',
  [
    protect,
    checkPermission('weeks', 'update'),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('order_number', 'Order number must be numeric').optional().isNumeric()
  ],
  updateWeek
);

// Delete week
router.delete(
  '/:id',
  [
    protect,
    checkPermission('weeks', 'delete')
  ],
  deleteWeek
);

module.exports = router; 