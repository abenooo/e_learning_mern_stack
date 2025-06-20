const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getUserEnrollments,
  getBatchCourseEnrollments,
  updateEnrollmentProgress,
  getUserEnrolledBatches,
  getEnrolledCoursePhases,
  getPhaseWeeks
} = require('../controllers/enrollments');

// Custom middleware for student enrollment access
const allowStudentEnrollmentAccess = async (req, res, next) => {
  try {
    // If user is accessing their own enrollments, allow it
    if (req.params.userId === req.user.id) {
      return next();
    }
    
    // Otherwise, check permissions
    return checkPermission('enrollments', 'read')(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       required:
 *         - user
 *         - batch_course
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the enrollment
 *         user:
 *           type: string
 *           description: The user ID
 *         batch_course:
 *           type: string
 *           description: The batch course ID
 *         enrollment_date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [active, completed, dropped]
 *           default: active
 *         enrollment_type:
 *           type: string
 *           enum: [paid, scholarship]
 *           default: paid
 *         payment_amount:
 *           type: number
 *           default: 0
 *         payment_status:
 *           type: string
 *           enum: [pending, paid, completed, waived]
 *           default: pending
 *         completion_date:
 *           type: string
 *           format: date-time
 *         enrolled_by:
 *           type: string
 *           description: The user ID who enrolled the student
 *         progress_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 0
 */

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Get all enrollments with filtering and pagination
 *     tags: [Enrollments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, dropped]
 *       - in: query
 *         name: enrollment_type
 *         schema:
 *           type: string
 *           enum: [paid, scholarship]
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [pending, paid, completed, waived]
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
 *           enum: [enrollment_date, created_at]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of enrollments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enrollment'
 */
router.get('/', protect, checkPermission('enrollments', 'read'), getEnrollments);

/**
 * @swagger
 * /enrollments/{id}:
 *   get:
 *     summary: Get a single enrollment
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 */
router.get('/:id', protect, checkPermission('enrollments', 'read'), getEnrollment);

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Create a new enrollment
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - batch_course
 *             properties:
 *               user:
 *                 type: string
 *               batch_course:
 *                 type: string
 *               enrollment_type:
 *                 type: string
 *                 enum: [paid, scholarship]
 *               payment_amount:
 *                 type: number
 *               payment_status:
 *                 type: string
 *                 enum: [pending, paid, completed, waived]
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 */
router.post(
  '/',
  [
    protect,
    checkPermission('enrollments', 'create'),
    check('user', 'User ID is required').not().isEmpty(),
    check('batch_course', 'Batch course ID is required').not().isEmpty(),
    check('enrollment_type', 'Invalid enrollment type')
      .optional()
      .isIn(['paid', 'scholarship']),
    check('payment_amount', 'Payment amount must be a number').optional().isNumeric(),
    check('payment_status', 'Invalid payment status')
      .optional()
      .isIn(['pending', 'paid', 'completed', 'waived'])
  ],
  createEnrollment
);

/**
 * @swagger
 * /enrollments/{id}:
 *   put:
 *     summary: Update an enrollment
 *     tags: [Enrollments]
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
 *               status:
 *                 type: string
 *                 enum: [active, completed, dropped]
 *               payment_status:
 *                 type: string
 *                 enum: [pending, paid, completed, waived]
 *               progress_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 */
router.put(
  '/:id',
  [
    protect,
    checkPermission('enrollments', 'update'),
    check('status', 'Invalid status')
      .optional()
      .isIn(['active', 'completed', 'dropped']),
    check('payment_status', 'Invalid payment status')
      .optional()
      .isIn(['pending', 'paid', 'completed', 'waived']),
    check('progress_percentage', 'Progress percentage must be between 0 and 100')
      .optional()
      .isFloat({ min: 0, max: 100 })
  ],
  updateEnrollment
);

/**
 * @swagger
 * /enrollments/{id}:
 *   delete:
 *     summary: Delete an enrollment
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 */
router.delete('/:id', protect, checkPermission('enrollments', 'delete'), deleteEnrollment);

/**
 * @swagger
 * /enrollments/user/{userId}:
 *   get:
 *     summary: Get all enrollments for a user
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, dropped]
 *     responses:
 *       200:
 *         description: List of user's enrollments
 */
router.get('/user/:userId', protect, checkPermission('enrollments', 'read'), getUserEnrollments);

/**
 * @swagger
 * /enrollments/batch-course/{batchCourseId}:
 *   get:
 *     summary: Get all enrollments for a batch course
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: batchCourseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, dropped]
 *     responses:
 *       200:
 *         description: List of batch course enrollments
 */
/**
 * @swagger
 * /enrollments/enrolled-batches:
 *   get:
 *     summary: Get enrolled batches for current user with course details
 *     tags: [Enrollments]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: List of enrolled batches with course details
 */
router.get('/enrolled-batches', protect, getUserEnrolledBatches);

router.get('/batch-course/:batchCourseId', protect, checkPermission('enrollments', 'read'), getBatchCourseEnrollments);

/**
 * @swagger
 * /enrollments/{id}/progress:
 *   patch:
 *     summary: Update enrollment progress
 *     tags: [Enrollments]
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
 *             required:
 *               - progress_percentage
 *             properties:
 *               progress_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.patch(
  '/:id/progress',
  [
    protect,
    checkPermission('enrollments', 'update'),
    check('progress_percentage', 'Progress percentage must be between 0 and 100')
      .isFloat({ min: 0, max: 100 })
  ],
  updateEnrollmentProgress
);

/**
 * @swagger
 * /enrollments/user/{userId}/course/{courseId}/phases:
 *   get:
 *     summary: Get phases for a specific enrolled course
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of phases for the enrolled course
 */
router.get('/user/:userId/course/:courseId/phases', protect, allowStudentEnrollmentAccess, getEnrolledCoursePhases);

/**
 * @swagger
 * /enrollments/user/{userId}/phase/{phaseId}/weeks:
 *   get:
 *     summary: Get weeks for a specific phase
 *     tags: [Enrollments]
 */
router.get('/user/:userId/phase/:phaseId/weeks', protect, allowStudentEnrollmentAccess, getPhaseWeeks);

module.exports = router;