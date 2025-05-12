const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseInstructors,
  assignInstructor,
  removeInstructor
} = require('../controllers/courses');

// Get all courses
router.get('/', getCourses);

// Get single course
router.get('/:id', getCourse);

// Create course
router.post(
  '/',
  [
    protect,
    checkPermission('courses', 'create'),
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('duration_months', 'Duration is required').isNumeric()
  ],
  createCourse
);

// Update course
router.put(
  '/:id',
  [
    protect,
    checkPermission('courses', 'update'),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('description', 'Description is required').optional().not().isEmpty()
  ],
  updateCourse
);

// Delete course
router.delete('/:id', protect, checkPermission('courses', 'delete'), deleteCourse);

// Get course instructors
router.get('/:id/instructors', getCourseInstructors);

// Assign instructor to course
router.post(
  '/:id/instructors',
  [
    protect,
    checkPermission('courses', 'update'),
    check('user', 'User ID is required').not().isEmpty(),
    check('role', 'Role is required').isIn(['lead_instructor', 'assistant_instructor'])
  ],
  assignInstructor
);

// Remove instructor from course
router.delete(
  '/:id/instructors/:userId',
  protect,
  checkPermission('courses', 'update'),
  removeInstructor
);

module.exports = router;