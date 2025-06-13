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
    check('title', 'Week Name is required').not().isEmpty().trim(),
    check('display_title', 'Week Title is required').optional().not().isEmpty().trim(),
    check('description', 'Description is required').optional().trim(),
    check('order_number', 'Order number is required').not().isEmpty().isInt({ min: 1 }).withMessage('Order number must be a positive integer'),
    check('start_date', 'Start date must be a valid date').optional().isISO8601().toDate(),
    check('end_date', 'End date must be a valid date').optional().isISO8601().toDate(),
    check('group_session', 'Group Session ID must be a valid ID').optional().isMongoId(),
    check('live_session', 'Live Session ID must be a valid ID').optional().isMongoId(),
  ],
  createWeek
);

// Update week
router.put(
  '/:id',
  [
    protect,
    checkPermission('weeks', 'update'),
    check('title', 'Week Name is required').optional().not().isEmpty().trim(),
    check('display_title', 'Week Title is required').optional().not().isEmpty().trim(),
    check('description', 'Description must be a string').optional().trim(),
    check('order_number', 'Order number must be an integer').optional().isInt({ min: 1 }).withMessage('Order number must be a positive integer'),
    check('start_date', 'Start date must be a valid date').optional().isISO8601().toDate(),
    check('end_date', 'End date must be a valid date').optional().isISO8601().toDate(),
    check('group_session', 'Group Session ID must be a valid ID').optional().isMongoId(),
    check('live_session', 'Live Session ID must be a valid ID').optional().isMongoId(),
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