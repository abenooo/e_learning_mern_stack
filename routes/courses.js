const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');
const { uploadFields } = require('../middleware/upload');

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
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed]
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: 'New Course Title' }
 *               description: { type: string, example: 'Description of the new course.' }
 *               course_icon_path: { type: string, format: binary, description: 'Image file for the course icon' }
 *               course_url_path: { type: string, example: 'new-course-title' }
 *               price: { type: number, format: float, example: 99.99 }
 *               difficulty_level: { type: string, enum: [beginner, intermediate, advanced], example: beginner }
 *               status: { type: string, enum: [draft, published, archived], example: draft }
 *               duration_months: { type: number, example: 3 }
 *               course_type: { type: string, enum: [paid, free], example: paid }
 *               delivery_method: { type: string, enum: [online, offline, hybrid], example: online }
 *               payment_status: { type: string, enum: [pending, paid, failed], example: pending }
 *             required:
 *               - title
 *               - description
 *               - duration_months
 *               - course_url_path
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    protect,
    checkPermission('courses', 'create'),
    uploadFields([
      { name: 'course_icon_path', maxCount: 1 }
    ]),
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('course_url_path', 'Course path is required').not().isEmpty(),
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
      .isIn(['online', 'offline', 'hybrid']),
    check('payment_status', 'Invalid payment status')
      .optional()
      .isIn(['pending', 'paid', 'failed'])
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: 'Updated Course Title' }
 *               description: { type: string, example: 'Updated description of the course.' }
 *               course_icon_path: { type: string, format: binary, description: 'New image file for the course icon (optional)' }
 *               course_url_path: { type: string, example: 'updated-course-title' }
 *               price: { type: number, format: float, example: 129.99 }
 *               difficulty_level: { type: string, enum: [beginner, intermediate, advanced], example: advanced }
 *               status: { type: string, enum: [draft, published, archived], example: published }
 *               duration_months: { type: number, example: 6 }
 *               course_type: { type: string, enum: [paid, free], example: free }
 *               delivery_method: { type: string, enum: [online, offline, hybrid], example: hybrid }
 *               payment_status: { type: string, enum: [pending, paid, failed], example: paid }
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  [
    protect,
    checkPermission('courses', 'update'),
    uploadFields([
      { name: 'course_icon_path', maxCount: 1 }
    ]),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('description', 'Description is required').optional().not().isEmpty(),
    check('course_url_path', 'Course path is required').optional().not().isEmpty(),
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
      .isIn(['paid', 'free']),
    check('delivery_method', 'Invalid delivery method')
      .optional()
      .isIn(['online', 'offline', 'hybrid']),
    check('payment_status', 'Invalid payment status')
      .optional()
      .isIn(['pending', 'paid', 'failed'])
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
 *     summary: Get all instructors assigned to a specific course
 *     tags: [Courses]
 */
router.get('/:id/instructors', getCourseInstructors);

/**
 * @swagger
 * /api/courses/{id}/instructors:
 *   post:
 *     summary: Assign an instructor to a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string, example: '60d0fe4f5311236168a109cc' }
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Instructor assigned successfully
 *       400:
 *         description: Bad request (e.g., user not found, user is not an instructor, instructor already assigned)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/instructors',
  [
    protect,
    checkPermission('courses', 'update'),
    check('userId', 'User ID is required').not().isEmpty()
  ],
  assignInstructor
);

/**
 * @swagger
 * /api/courses/{id}/instructors/{userId}:
 *   delete:
 *     summary: Remove an instructor from a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, not authorized to remove this instructor
 *       404:
 *         description: Course or instructor not found for this course
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id/instructors/:userId',
  protect,
  checkPermission('courses', 'update'),
  removeInstructor
);

module.exports = router;