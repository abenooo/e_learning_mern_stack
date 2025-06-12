const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

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

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses with filtering and pagination
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: difficulty_level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: course_type
 *         schema:
 *           type: string
 *           enum: [paid, free]
 *       - in: query
 *         name: delivery_method
 *         schema:
 *           type: string
 *           enum: [online, offline, hybrid]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, duration_months, created_at]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 */
router.get('/', getCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a single course with detailed information
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', getCourse);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  [
    protect,
    checkPermission('courses', 'create'),
    uploadSingle('thumbnail'),
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('duration_months', 'Duration is required').trim().isNumeric(),
    check('price', 'Price must be a number').optional().isNumeric(),
    check('difficulty_level', 'Invalid difficulty level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced']),
    check('status', 'Invalid status')
      .optional()
      .isIn(['draft', 'published', 'archived']),
    check('course_type', 'Invalid course type')
      .optional()
      .isIn(['paid', 'free']),
    check('delivery_method', 'Invalid delivery method')
      .optional()
      .isIn(['online', 'offline', 'hybrid'])
  ],
  createCourse
);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  [
    protect,
    checkPermission('courses', 'update'),
    uploadSingle('thumbnail'),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('description', 'Description is required').optional().not().isEmpty(),
    check('duration_months', 'Duration must be a number').optional().trim().isNumeric(),
    check('price', 'Price must be a number').optional().isNumeric(),
    check('difficulty_level', 'Invalid difficulty level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced']),
    check('status', 'Invalid status')
      .optional()
      .isIn(['draft', 'published', 'archived']),
    check('course_type', 'Invalid course type')
      .optional()
      .isIn(['paid', 'free'])
  ],
  updateCourse
);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, checkPermission('courses', 'delete'), deleteCourse);

/**
 * @swagger
 * /api/courses/{id}/instructors:
 *   get:
 *     summary: Get course instructors
 *     tags: [Courses]
 */
router.get('/:id/instructors', getCourseInstructors);

/**
 * @swagger
 * /api/courses/{id}/instructors:
 *   post:
 *     summary: Assign instructor to course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
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

/**
 * @swagger
 * /api/courses/{id}/instructors/{userId}:
 *   delete:
 *     summary: Remove instructor from course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id/instructors/:userId',
  protect,
  checkPermission('courses', 'update'),
  removeInstructor
);

module.exports = router;