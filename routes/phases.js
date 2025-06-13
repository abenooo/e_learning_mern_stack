const express = require('express');
const { check } = require('express-validator');
const { uploadPhaseIcon } = require('../middleware/phaseUpload');
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
    uploadPhaseIcon('icon_url'),
    check('course', 'Course ID is required').not().isEmpty(),
    check('title', 'Phase title is required').not().isEmpty().trim(),
    check('description', 'Description is required').optional().trim(),
    check('order_number', 'Order number is required').not().isEmpty().isInt({ min: 1 }).withMessage('Order number must be a positive integer'),
    check('start_date', 'Start date must be a valid date').optional().isISO8601().toDate(),
    check('end_date', 'End date must be a valid date').optional().isISO8601().toDate(),
  ],
  createPhase
);

// Update phase
router.put(
  '/:id',
  [
    protect,
    checkPermission('phases', 'update'),
    uploadPhaseIcon('icon_url'),
    check('title', 'Phase title is required').optional().not().isEmpty().trim(),
    check('description', 'Description must be a string').optional().trim(),
    check('order_number', 'Order number must be an integer').optional().isInt({ min: 1 }).withMessage('Order number must be a positive integer'),
    check('start_date', 'Start date must be a valid date').optional().isISO8601().toDate(),
    check('end_date', 'End date must be a valid date').optional().isISO8601().toDate(),
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
