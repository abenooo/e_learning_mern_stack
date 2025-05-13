// routes/users.js - Updated routes
const express = require('express');
const { check } = require('express-validator');
const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserRoles,
  assignRole,
  removeRole
} = require('../controllers/users');

// Get all users
router.get('/', protect, checkPermission('users', 'read'), getUsers);

// Get single user
router.get('/:id', protect, checkPermission('users', 'read'), getUser);

// Create user (admin only)
router.post(
  '/',
  [
    protect,
    authorize('super_admin', 'admin'),
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  createUser
);

// Update user
router.put(
  '/:id',
  [
    protect,
    checkPermission('users', 'update'),
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail()
  ],
  updateUser
);

// Delete user (super_admin only)
router.delete('/:id', protect, authorize('super_admin'), deleteUser);

// Get user roles
router.get('/:id/roles', protect, checkPermission('users', 'read'), getUserRoles);

// Assign role to user (super_admin only for non-student roles)
router.post(
  '/:id/roles',
  [
    protect,
    check('role', 'Role ID is required').not().isEmpty()
  ],
  assignRole
);

// Remove role from user (super_admin only)
router.delete(
  '/:id/roles/:roleId',
  protect,
  authorize('super_admin'),
  removeRole
);

module.exports = router;