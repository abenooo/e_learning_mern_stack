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
  deleteGroup,
  getGroupUsers,
  addUser,
  removeUser
} = require('../controllers/groups');

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups with filtering and pagination
 *     tags: [Groups]
 */
router.get('/', getGroups);

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get a single group with detailed information
 *     tags: [Groups]
 */
router.get('/:id', getGroup);

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 */
router.post(
  '/',
  [
    protect,
    checkPermission('groups', 'create'),
    check('batch', 'Batch ID is required').not().isEmpty(),
    check('name', 'Group name is required').not().isEmpty(),
    check('max_members', 'Max members must be a number').optional().isNumeric(),
    check('class_days', 'Class days is required').optional().not().isEmpty(),
    check('class_start_time', 'Class start time is required').optional().not().isEmpty(),
    check('class_end_time', 'Class end time is required').optional().not().isEmpty(),
    check('status', 'Invalid status')
      .optional()
      .isIn(['active', 'inactive'])
  ],
  createGroup
);

/**
 * @swagger
 * /api/groups/{id}:
 *   put:
 *     summary: Update a group
 *     tags: [Groups]
 */
router.put(
  '/:id',
  [
    protect,
    checkPermission('groups', 'update'),
    check('name', 'Group name is required').optional().not().isEmpty(),
    check('max_members', 'Max members must be a number').optional().isNumeric(),
    check('class_days', 'Class days is required').optional().not().isEmpty(),
    check('class_start_time', 'Class start time is required').optional().not().isEmpty(),
    check('class_end_time', 'Class end time is required').optional().not().isEmpty(),
    check('status', 'Invalid status')
      .optional()
      .isIn(['active', 'inactive'])
  ],
  updateGroup
);

/**
 * @swagger
 * /api/groups/{id}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 */
router.delete('/:id', protect, checkPermission('groups', 'delete'), deleteGroup);

/**
 * @swagger
 * /api/groups/{id}/users:
 *   get:
 *     summary: Get all users in a group
 *     tags: [Groups]
 */
router.get('/:id/users', protect, checkPermission('groups', 'read'), getGroupUsers);

/**
 * @swagger
 * /api/groups/{id}/users:
 *   post:
 *     summary: Add a user to a group
 *     tags: [Groups]
 */
router.post(
  '/:id/users',
  [
    protect,
    checkPermission('groups', 'update'),
    check('user', 'User ID is required').not().isEmpty(),
    check('role', 'Role is required').isIn(['student', 'group_instructor'])
  ],
  addUser
);

/**
 * @swagger
 * /api/groups/{id}/users/{userId}:
 *   delete:
 *     summary: Remove a user from a group
 *     tags: [Groups]
 */
router.delete(
  '/:id/users/:userId',
  protect,
  checkPermission('groups', 'update'),
  removeUser
);

module.exports = router;
