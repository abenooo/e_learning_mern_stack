const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getClassComponents,
  getClassComponent,
  createClassComponent,
  updateClassComponent,
  deleteClassComponent
} = require('../controllers/classComponents');

// Get all class components
router.get('/', getClassComponents);

// Get single class component
router.get('/:id', getClassComponent);

// Create class component
router.post(
  '/',
  [
    protect,
    checkPermission('class_components', 'create'),
    check('class', 'Class ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('component_type', 'Component type is required').isIn(['video', 'document', 'quiz', 'assignment']),
    check('order_number', 'Order number is required').isNumeric()
  ],
  createClassComponent
);

// Update class component
router.put(
  '/:id',
  [
    protect,
    checkPermission('class_components', 'update'),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('component_type', 'Invalid component type').optional().isIn(['video', 'document', 'quiz', 'assignment']),
    check('order_number', 'Order number must be numeric').optional().isNumeric()
  ],
  updateClassComponent
);

// Delete class component
router.delete(
  '/:id',
  [
    protect,
    checkPermission('class_components', 'delete')
  ],
  deleteClassComponent
);

module.exports = router; 