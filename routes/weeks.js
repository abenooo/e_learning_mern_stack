const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getWeeks,
  getWeek,
  createWeek,
  updateWeek,
  deleteWeek
} = require('../controllers/weeks');

/**
 * @swagger
 * /api/weeks:
 *   get:
 *     summary: Get all weeks with filtering and pagination
 *     tags: [Weeks]
 *     parameters:
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *         description: Filter by phase ID
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by Course ID (weeks belong to phases which belong to courses)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [week_order, created_at]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of weeks
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
 *                     $ref: '#/components/schemas/Week'
 */
router.get('/', getWeeks);

/**
 * @swagger
 * /api/weeks/{id}:
 *   get:
 *     summary: Get a single week
 *     tags: [Weeks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Week ID
 *     responses:
 *       200:
 *         description: Week details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Week'
 *       404:
 *         description: Week not found
 */
router.get('/:id', getWeek);

/**
 * @swagger
 * /api/weeks:
 *   post:
 *     summary: Create a new week
 *     tags: [Weeks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course: { type: string, description: 'Course ID' }
 *               phase: { type: string, description: 'Phase ID' }
 *               week_name: { type: string, description: 'Name of the week' }
 *               week_title: { type: string, description: 'Display title of the week' }
 *               group_sessions: { type: string, description: 'JSON string or comma-separated IDs of group sessions' }
 *               live_sessions: { type: string, description: 'JSON string or comma-separated IDs of live sessions' }
 *               week_order: { type: integer, description: 'Order number of the week' }
 *             required:
 *               - course
 *               - phase
 *               - week_name
 *               - week_order
 *     responses:
 *       201:
 *         description: Week created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Week'
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
    checkPermission('weeks', 'create'),
    check('course', 'Course ID is required').not().isEmpty(),
    check('phase', 'Phase ID is required').not().isEmpty(),
    check('week_name', 'Week Name is required').not().isEmpty().trim(),
    check('week_title', 'Week Title is required').optional().trim(),
    check('group_sessions', 'Group Sessions must be a string').optional().isString(),
    check('live_sessions', 'Live Sessions must be a string').optional().isString(),
    check('week_order', 'Week order is required').not().isEmpty().isInt({ min: 1 }).withMessage('Week order must be a positive integer'),
  ],
  createWeek
);

/**
 * @swagger
 * /api/weeks/{id}:
 *   put:
 *     summary: Update a week
 *     tags: [Weeks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Week ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course: { type: string, description: 'Course ID' }
 *               phase: { type: string, description: 'Phase ID' }
 *               week_name: { type: string, description: 'Name of the week' }
 *               week_title: { type: string, description: 'Display title of the week' }
 *               group_sessions: { type: string, description: 'JSON string or comma-separated IDs of group sessions' }
 *               live_sessions: { type: string, description: 'JSON string or comma-separated IDs of live sessions' }
 *               week_order: { type: integer, description: 'Order number of the week' }
 *     responses:
 *       200:
 *         description: Week updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Week'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Week not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  [
    protect,
    checkPermission('weeks', 'update'),
    check('course', 'Course ID is required').optional().not().isEmpty(),
    check('phase', 'Phase ID must be a valid ID').optional().not().isEmpty(),
    check('week_name', 'Week Name is required').optional().not().isEmpty().trim(),
    check('week_title', 'Week Title is required').optional().trim(),
    check('group_sessions', 'Group Sessions must be a string').optional().isString(),
    check('live_sessions', 'Live Sessions must be a string').optional().isString(),
    check('week_order', 'Week order must be an integer').optional().isInt({ min: 1 }).withMessage('Week order must be a positive integer'),
  ],
  updateWeek
);

/**
 * @swagger
 * /api/weeks/{id}:
 *   delete:
 *     summary: Delete a week
 *     tags: [Weeks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Week ID
 *     responses:
 *       200:
 *         description: Week deleted successfully
 *       404:
 *         description: Week not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  [
    protect,
    checkPermission('weeks', 'delete')
  ],
  deleteWeek
);

module.exports = router; 