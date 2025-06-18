const express = require('express');
const { check } = require('express-validator');
const { uploadFields } = require('../middleware/upload');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getPhases,
  getPhase,
  createPhase,
  updatePhase,
  deletePhase
} = require('../controllers/phases');

/**
 * @swagger
 * /api/phases:
 *   get:
 *     summary: Get all phases with filtering and pagination
 *     tags: [Phases]
 *     parameters:
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by course ID
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
 *           enum: [phase_order, created_at]
 *         description: Field to sort phases by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of phases
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
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Phase'
 *       500:
 *         description: Server error
 */
router.get('/', getPhases);

/**
 * @swagger
 * /api/phases/{id}:
 *   get:
 *     summary: Get a single phase by ID
 *     tags: [Phases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phase ID
 *     responses:
 *       200:
 *         description: Phase details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Phase'
 *       404:
 *         description: Phase not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getPhase);

/**
 * @swagger
 * /api/phases:
 *   post:
 *     summary: Create a new phase
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               course: { type: string, description: 'Course ID' }
 *               phase_name: { type: string, description: 'Name of the phase' }
 *               phase_title: { type: string, description: 'Display title of the phase' }
 *               phase_url_path: { type: string, format: binary, description: 'File for the phase URL path' }
 *               phase_description: { type: string, description: 'Description of the phase' }
 *               phase_icon_path: { type: string, format: binary, description: 'Image file for the phase icon' }
 *               phase_order: { type: integer, description: 'Order number of the phase' }
 *             required:
 *               - course
 *               - phase_name
 *               - phase_order
 *     responses:
 *       201:
 *         description: Phase created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Phase'
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
    checkPermission('phases', 'create'),
    uploadFields([
      { name: 'phase_icon_path', maxCount: 1 },
      { name: 'phase_url_path', maxCount: 1 }
    ]),
    check('course', 'Course ID is required').not().isEmpty(),
    check('phase_name', 'Phase name is required').not().isEmpty().trim(),
    check('phase_title', 'Phase title is required').optional().trim(),
    check('phase_description', 'Phase description must be a string').optional().trim(),
    check('phase_order', 'Phase order is required').not().isEmpty().isInt({ min: 1 }).withMessage('Phase order must be a positive integer'),
    check('icon', 'Icon must be a string').optional().trim(),
    check('path', 'Path must be a string').optional().trim(),
    check('brief_description', 'Brief description must be a string').optional().trim(),
    check('full_description', 'Full description must be a string').optional().trim(),
    check('hash', 'Hash must be a string').optional().trim(),
  ],
  createPhase
);

/**
 * @swagger
 * /api/phases/{id}:
 *   put:
 *     summary: Update a phase by ID
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phase ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               course: { type: string, description: 'Course ID' }
 *               phase_name: { type: string, description: 'Name of the phase' }
 *               phase_title: { type: string, description: 'Display title of the phase' }
 *               phase_url_path: { type: string, format: binary, description: 'New file for the phase URL path (optional)' }
 *               phase_description: { type: string, description: 'Description of the phase' }
 *               phase_icon_path: { type: string, format: binary, description: 'New image file for the phase icon (optional)' }
 *               phase_order: { type: integer, description: 'Order number of the phase' }
 *     responses:
 *       200:
 *         description: Phase updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Phase'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Phase not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  [
    protect,
    checkPermission('phases', 'update'),
    uploadFields([
      { name: 'phase_icon_path', maxCount: 1 },
      { name: 'phase_url_path', maxCount: 1 }
    ]),
    check('course', 'Course ID is required').optional().not().isEmpty(),
    check('phase_name', 'Phase name is required').optional().not().isEmpty().trim(),
    check('phase_title', 'Phase title is required').optional().trim(),
    check('phase_description', 'Phase description must be a string').optional().trim(),
    check('phase_order', 'Phase order must be an integer').optional().isInt({ min: 1 }).withMessage('Phase order must be a positive integer'),
  ],
  updatePhase
);

/**
 * @swagger
 * /api/phases/{id}:
 *   delete:
 *     summary: Delete a phase by ID
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phase ID
 *     responses:
 *       200:
 *         description: Phase deleted successfully
 *       404:
 *         description: Phase not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  [
    protect,
    checkPermission('phases', 'delete')
  ],
  deletePhase
);

module.exports = router;
