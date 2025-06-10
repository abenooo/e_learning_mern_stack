const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass
} = require('../controllers/classes');

// Get all classes
router.get('/', getClasses);

// Get single class
router.get('/:id', getClass);

// Create class
router.post(
  '/',
  [
    protect,
    checkPermission('classes', 'create'),
    check('week', 'Week ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('order_number', 'Order number is required').isNumeric(),
    check('type', 'Invalid class type').optional().isIn(['lecture', 'workshop', 'assessment'])
  ],
  createClass
);

// Update class
router.put(
  '/:id',
  [
    protect,
    checkPermission('classes', 'update'),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('order_number', 'Order number must be numeric').optional().isNumeric(),
    check('type', 'Invalid class type').optional().isIn(['lecture', 'workshop', 'assessment'])
  ],
  updateClass
);

// Delete class
router.delete(
  '/:id',
  [
    protect,
    checkPermission('classes', 'delete')
  ],
  deleteClass
);

module.exports = router; 