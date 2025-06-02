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

/**
 * @swagger
 * /api/batches:
 *   get:
 *     summary: Get all batches with filtering and pagination
 *     tags: [Batches]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, upcoming]
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
 *           enum: [start_date, end_date, created_at]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of batches
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
 *                     $ref: '#/components/schemas/Batch'
 */
router.get('/', getBatches);

/**
 * @swagger
 * /api/batches/{id}:
 *   get:
 *     summary: Get a single batch with detailed information
 *     tags: [Batches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Batch'
 */
router.get('/:id', getBatch);

/**
 * @swagger
 * /api/batches:
 *   post:
 *     summary: Create a new batch
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - batch_code
 *               - full_name
 *               - start_date
 *               - end_date
 *             properties:
 *               name:
 *                 type: string
 *                 description: Short name of the batch
 *               batch_code:
 *                 type: string
 *                 description: Unique code for the batch
 *               full_name:
 *                 type: string
 *                 description: Full name of the batch
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Batch start date
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Batch end date
 *               description:
 *                 type: string
 *                 description: Batch description
 *               capacity:
 *                 type: integer
 *                 description: Maximum number of students
 *     responses:
 *       201:
 *         description: Batch created successfully
 */
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

/**
 * @swagger
 * /api/batches/{id}:
 *   put:
 *     summary: Update a batch
 *     tags: [Batches]
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
 *               name:
 *                 type: string
 *               batch_code:
 *                 type: string
 *               full_name:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Batch updated successfully
 */
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

/**
 * @swagger
 * /api/batches/{id}:
 *   delete:
 *     summary: Delete a batch
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch deleted successfully
 */
router.delete('/:id', protect, checkPermission('batches', 'delete'), deleteBatch);

/**
 * @swagger
 * /api/batches/{id}/courses:
 *   get:
 *     summary: Get all courses in a batch
 *     tags: [Batches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of courses in the batch
 */
router.get('/:id/courses', getBatchCourses);

/**
 * @swagger
 * /api/batches/{id}/courses:
 *   post:
 *     summary: Add a course to a batch
 *     tags: [Batches]
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
 *             required:
 *               - course
 *               - start_date
 *               - end_date
 *             properties:
 *               course:
 *                 type: string
 *                 description: Course ID
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Course added to batch successfully
 */
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

/**
 * @swagger
 * /api/batches/{id}/courses/{courseId}:
 *   delete:
 *     summary: Remove a course from a batch
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Course removed from batch successfully
 */
router.delete(
  '/:id/courses/:courseId',
  protect,
  checkPermission('batches', 'update'),
  removeCourse
);

/**
 * @swagger
 * /api/batches/{id}/users:
 *   get:
 *     summary: Get all users in a batch
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users in the batch
 */
router.get('/:id/users', protect, checkPermission('batches', 'read'), getBatchUsers);

/**
 * @swagger
 * /api/batches/{id}/users:
 *   post:
 *     summary: Add a user to a batch
 *     tags: [Batches]
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
 *             required:
 *               - user
 *               - role
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID
 *               role:
 *                 type: string
 *                 enum: [student, instructor, group_instructor]
 *     responses:
 *       200:
 *         description: User added to batch successfully
 */
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

/**
 * @swagger
 * /api/batches/{id}/users/{userId}:
 *   delete:
 *     summary: Remove a user from a batch
 *     tags: [Batches]
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
 *         description: User removed from batch successfully
 */
router.delete(
  '/:id/users/:userId',
  protect,
  checkPermission('batches', 'update'),
  removeUser
);

module.exports = router;