const Phase = require('../models/Phase'); // Import the Phase model
const { validationResult } = require('express-validator');
const { upload, cloudinary } = require('../config/cloudinary'); // Import for image handling

/**
 * @swagger
 * components:
 *   schemas:
 *     Phase:
 *       type: object
 *       required:
 *         - batch_course
 *         - title
 *         - order_number
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the phase
 *         batch_course:
 *           type: string
 *           description: Reference to the batch course ID
 *         title:
 *           type: string
 *           description: Title of the phase
 *         display_title:
 *           type: string
 *           description: Title of the phase
 *         description:
 *           type: string
 *           description: Description of the phase
 *         icon_url:
 *           type: string
 *           description: URL of the phase icon hosted on Cloudinary
 *         order_number:
 *           type: integer
 *           description: Order number of the phase
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Start date of the phase (ISO 8601 format)
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: End date of the phase (ISO 8601 format)
 *         is_active:
 *           type: boolean
 *           description: Whether the phase is active
 *           default: true
 *         is_required:
 *           type: boolean
 *           description: Whether the phase is required for completion
 *           default: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /phases:
 *   get:
 *     summary: Get all phases with filtering and pagination
 *     tags: [Phases]
 *     parameters:
 *       - in: query
 *         name: batch_course
 *         schema:
 *           type: string
 *         description: Filter by batch course ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter phases by active status (true/false)
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
 *           enum: [order_number, start_date, end_date, created_at]
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
const getPhases = async (req, res, next) => {
  try {
    console.log('Get all phases request received');

    // Build query
    const query = {};

    // Filter by batch course
    if (req.query.batch_course) {
      query.batch_course = req.query.batch_course;
    }

    // Filter by active status
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Sorting
    const sortField = req.query.sort || 'order_number';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    // Execute query with pagination and populate batch_course
    const phases = await Phase.find(query)
      .populate({
        path: 'batch_course',
        select: 'title _id' // Select only title and _id fields
      })
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    // Get total count for pagination
    const total = await Phase.countDocuments(query);

    console.log(`Found ${phases.length} phases out of ${total} total`);

    res.status(200).json({
      success: true,
      count: phases.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: phases
    });
  } catch (error) {
    console.error('Get phases error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /phases/{id}:
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
const getPhase = async (req, res, next) => {
  try {
    console.log(`Get phase request received for ID: ${req.params.id}`);

    const phase = await Phase.findById(req.params.id)
      .populate('course', 'title');

    if (!phase) {
      console.log(`Phase not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    console.log(`Found phase: ${phase.title}`);

    res.status(200).json({
      success: true,
      data: phase
    });
  } catch (error) {
    console.error('Get phase error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /phases:
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
 *             required:
 *               - batch_course
 *               - title
 *               - order_number
 *             properties:
 *               batch_course:
 *                 type: string
 *                 description: ID of the batch course this phase belongs to
 *               title:
 *                 type: string
 *                 description: Title of the phase
 *               display_title:
 *                 type: string
 *                 description: Title of the phase
 *               description:
 *                 type: string
 *                 description: Description of the phase
 *               icon_url:
 *                 type: string
 *                 format: binary
 *                 description: Image file for the phase icon (e.g., 60x60, jpg, jpeg, gif, png)
 *               order_number:
 *                 type: integer
 *                 description: Order number of the phase
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the phase (ISO 8601 format)
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the phase (ISO 8601 format)
 *               is_active:
 *                 type: boolean
 *                 description: Whether the phase is active
 *                 default: true
 *               is_required:
 *                 type: boolean
 *                 description: Whether the phase is required for completion
 *                 default: true
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
const createPhase = async (req, res, next) => {
  try {
    console.log('Create phase request received');

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Validate batch_course exists (basic check, more robust validation might involve checking if ID exists in DB)
    if (!req.body.batch_course) {
      return res.status(400).json({
        success: false,
        error: 'Batch course ID is required'
      });
    }

    // Handle icon_url upload
    if (req.file) {
      req.body.icon_url = req.file.path; // Cloudinary URL
    }

    // Ensure order_number is parsed as an integer
    if (req.body.order_number) {
      req.body.order_number = parseInt(req.body.order_number, 10);
    }

    // Create phase
    const phase = await Phase.create(req.body);

    // Populate batch_course after creation for the response
    const populatedPhase = await Phase.findById(phase._id)
      .populate({
        path: 'batch_course',
        select: 'title _id'
      });

    console.log(`Phase created with ID: ${phase._id}`);

    res.status(201).json({
      success: true,
      data: populatedPhase
    });
  } catch (error) {
    console.error('Create phase error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /phases/{id}:
 *   put:
 *     summary: Update an existing phase by ID
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
 *               title:
 *                 type: string
 *                 description: Updated title of the phase
 *               display_title:
 *                 type: string
 *                 description: Updated title of the phase
 *               description:
 *                 type: string
 *                 description: Updated description of the phase
 *               icon_url:
 *                 type: string
 *                 format: binary
 *                 description: New image file for the phase icon (optional)
 *               order_number:
 *                 type: integer
 *                 description: Updated order number of the phase
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Updated start date of the phase (ISO 8601 format)
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Updated end date of the phase (ISO 8601 format)
 *               is_active:
 *                 type: boolean
 *                 description: Updated active status
 *               is_required:
 *                 type: boolean
 *                 description: Updated required status
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
const updatePhase = async (req, res, next) => {
  try {
    console.log(`Update phase request received for ID: ${req.params.id}`);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Find phase
    let phase = await Phase.findById(req.params.id);

    if (!phase) {
      console.log(`Phase not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    // Handle icon_url upload
    if (req.file) {
      // Delete old icon from Cloudinary if it exists
      if (phase.icon_url) {
        const publicId = phase.icon_url.split('/').pop().split('.')[0]; // Assumes publicId is filename without extension
        await cloudinary.uploader.destroy(publicId);
      }
      req.body.icon_url = req.file.path; // Update with new Cloudinary URL
    }
    // Ensure order_number is parsed as an integer if provided
    if (req.body.order_number) {
      req.body.order_number = parseInt(req.body.order_number, 10);
    }

    // Update phase
    phase = await Phase.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    console.log(`Phase updated: ${phase.title}`);

    res.status(200).json({
      success: true,
      data: phase
    });
  } catch (error) {
    console.error('Update phase error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /phases/{id}:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Phase not found
 *       500:
 *         description: Server error
 */
const deletePhase = async (req, res, next) => {
  try {
    console.log(`Delete phase request received for ID: ${req.params.id}`);

    // Find phase
    const phase = await Phase.findById(req.params.id);

    if (!phase) {
      console.log(`Phase not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    // Delete icon from Cloudinary if it exists
    if (phase.icon_url) {
      const publicId = phase.icon_url.split('/').pop().split('.')[0]; // Assumes publicId is filename without extension
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete phase
    await Phase.findByIdAndDelete(req.params.id);
    console.log(`Phase deleted: ${phase.title}`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete phase error:', error);
    next(error);
  }
};

// Export all controller functions
module.exports = {
  getPhases,
  getPhase,
  createPhase,
  updatePhase,
  deletePhase,
};