const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup
} = require('../controllers/groups');

// Get all groups
router.get('/', getGroups);

// Get single group
router.get('/:id', getGroup);

// Create group
router.post(
  '/',
  [
    protect,
    checkPermission('groups', 'create'),
    check('batch', 'Batch ID is required').not().isEmpty(),
    check('name', 'Name is required').not().isEmpty(),
    check('status', 'Invalid status')
      .optional()
      .isIn(['active', 'inactive'])
  ],
  createGroup
);

// Update group
router.put(
  '/:id',
  [
    protect,
    checkPermission('groups', 'update'),
    check('name', 'Name is required').optional().not().isEmpty(),
    check('status', 'Invalid status')
      .optional()
      .isIn(['active', 'inactive'])
  ],
  updateGroup
);

// Delete group
router.delete(
  '/:id',
  [
    protect,
    checkPermission('groups', 'delete')
  ],
  deleteGroup
);

module.exports = router;