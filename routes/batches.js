const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchCourses,
  addCourse,
  removeCourse,
  getBatchUsers,
  addUser,
  removeUser
} = require('../controllers/batches');

// Get all batches
router.get('/', getBatches);

// Get single batch
router.get('/:id', getBatch);

// Create batch
router.post(
  '/',
  [
    protect,
    checkPermission('batches', 'create'),
    check('name', 'Name is required').not().isEmpty(),
    check('batch_code', 'Batch code is required').not().isEmpty(),
    check('full_name', 'Full name is required').not().isEmpty(),
    check('start_date', 'Start date is required').isISO8601(),
    check('end_date', 'End date is required').isISO8601()
  ],
  createBatch
);

// Update batch
router.put(
  '/:id',
  [
    protect,
    checkPermission('batches', 'update'),
    check('name', 'Name is required').optional().not().isEmpty(),
    check('batch_code', 'Batch code is required').optional().not().isEmpty()
  ],
  updateBatch
);

// Delete batch
router.delete('/:id', protect, checkPermission('batches', 'delete'), deleteBatch);

// Get batch courses
router.get('/:id/courses', getBatchCourses);

// Add course to batch
router.post(
  '/:id/courses',
  [
    protect,
    checkPermission('batches', 'update'),
    check('course', 'Course ID is required').not().isEmpty(),
    check('start_date', 'Start date is required').isISO8601(),
    check('end_date', 'End date is required').isISO8601()
  ],
  addCourse
);

// Remove course from batch
router.delete(
  '/:id/courses/:courseId',
  protect,
  checkPermission('batches', 'update'),
  removeCourse
);

// Get batch users
router.get('/:id/users', protect, checkPermission('batches', 'read'), getBatchUsers);

// Add user to batch
router.post(
  '/:id/users',
  [
    protect,
    checkPermission('batches', 'update'),
    check('user', 'User ID is required').not().isEmpty(),
    check('role', 'Role is required').isIn(['student', 'instructor', 'group_instructor'])
  ],
  addUser
);

// Remove user from batch
router.delete(
  '/:id/users/:userId',
  protect,
  checkPermission('batches', 'update'),
  removeUser
);

module.exports = router;