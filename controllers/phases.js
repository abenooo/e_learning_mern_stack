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
 *         - course
 *         - phase_name
 *         - phase_order
 *         - created_by
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the phase
 *         course:
 *           type: string
 *           description: Reference to the Course ID
 *         phase_name:
 *           type: string
 *           description: Name of the phase
 *         phase_title:
 *           type: string
 *           description: Display title of the phase
 *         phase_url_path:
 *           type: string
 *           description: URL path of the phase (e.g., for icon or resources)
 *         phase_description:
 *           type: string
 *           description: Description of the phase
 *         phase_icon_path:
 *           type: string
 *           description: URL of the phase icon hosted on Cloudinary
 *         phase_order:
 *           type: integer
 *           description: Order number of the phase
 *         created_by:
 *           type: string
 *           description: Reference to the User ID who created the phase
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
const getPhases = async (req, res, next) => {
  try {
    // Build query
    const query = {};

    // Filter by course
    if (req.query.course) {
      query.course = req.query.course;
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Sorting
    const sortField = req.query.sort || 'phase_order';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    // Execute query with pagination and populate course and creator
    const phases = await Phase.find(query)
      .populate({
        path: 'course',
        select: '_id title description price duration_months difficulty_level status course_type delivery_method'
      })
      .populate({
        path: 'created_by',
        select: '_id name email'
      })
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    // Get total count for pagination
    const total = await Phase.countDocuments(query);

    // Format the response to match course format
    const formattedPhases = phases.map(phase => ({
      _id: phase._id,
      title: phase.phase_name,
      description: phase.phase_description,
      phase_icon_path: phase.phase_icon_path,
      phase_url_path: phase.phase_url_path,
      payment_status: phase.payment_status || 'pending',
      price: phase.price || 0,
      creator: {
        _id: phase.created_by._id,
        name: phase.created_by.name,
        email: phase.created_by.email
      },
      difficulty_level: phase.difficulty_level || 'beginner',
      status: phase.status || 'draft',
      duration_months: phase.duration_months || 0,
      course_type: phase.course_type || 'paid',
      delivery_method: phase.delivery_method || 'online',
      is_active: phase.is_active,
      created_at: phase.created_at,
      updated_at: phase.updated_at,
      __v: phase.__v,
      course: phase.course
    }));

    res.status(200).json({
      success: true,
      count: formattedPhases.length,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: Math.ceil(total / limit)
      },
      data: formattedPhases
    });
  } catch (error) {
    console.error('Get phases error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
    const phase = await Phase.findById(req.params.id)
      .populate('course', '_id title description price duration_months difficulty_level status course_type delivery_method')
      .populate('created_by', '_id name email');

    if (!phase) {
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    // Format the response to match course format
    const formattedPhase = {
      _id: phase._id,
      title: phase.phase_name,
      description: phase.phase_description,
      phase_icon_path: phase.phase_icon_path,
      phase_url_path: phase.phase_url_path,
      payment_status: phase.payment_status || 'pending',
      price: phase.price || 0,
      creator: {
        _id: phase.created_by._id,
        name: phase.created_by.name,
        email: phase.created_by.email
      },
      difficulty_level: phase.difficulty_level || 'beginner',
      status: phase.status || 'draft',
      duration_months: phase.duration_months || 0,
      course_type: phase.course_type || 'paid',
      delivery_method: phase.delivery_method || 'online',
      is_active: phase.is_active,
      created_at: phase.created_at,
      updated_at: phase.updated_at,
      __v: phase.__v,
      course: phase.course
    };

    res.status(200).json({
      success: true,
      data: formattedPhase
    });
  } catch (error) {
    console.error('Get phase error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
 *             properties:
 *               course_id: { type: string, description: 'Course ID' }
 *               phase_name: { type: string, description: 'Name of the phase' }
 *               phase_order: { type: integer, description: 'Order number of the phase' }
 *               phase_description: { type: string, description: 'Description of the phase' }
 *               phase_icon_path: { type: string, format: binary, description: 'Phase icon file' }
 *               phase_url_path: { type: string, format: binary, description: 'Phase resources file' }
 *             required:
 *               - course_id
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
const createPhase = async (req, res, next) => {
  try {
    // Validate required fields
    const requiredFields = ['course_id', 'phase_name', 'phase_order'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        errors: [
          { msg: `Missing required fields: ${missingFields.join(', ')}` }
        ]
      });
    }

    // Add creator to request body
    req.body.created_by = req.user.id;

    // Handle file uploads
    if (req.files) {
      if (req.files.phase_icon_path) {
        const result = await cloudinary.uploader.upload(req.files.phase_icon_path[0].path);
        req.body.phase_icon_path = result.secure_url;
      }
      if (req.files.phase_url_path) {
        const result = await cloudinary.uploader.upload(req.files.phase_url_path[0].path);
        req.body.phase_url_path = result.secure_url;
      }
    }

    // Set default values
    const defaults = {
      phase_title: req.body.phase_name,
      phase_description: req.body.phase_name,
      is_active: true
    };

    // Merge defaults with request body
    req.body = { ...defaults, ...req.body };

    const phase = await Phase.create(req.body);
    
    res.status(201).json({
      success: true,
      data: phase
    });
  } catch (error) {
    console.error('Create phase error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @swagger
 * /phases/{id}:
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course: { type: string, description: 'Course ID' }
 *               phase_name: { type: string, description: 'Name of the phase' }
 *               phase_title: { type: string, description: 'Display title of the phase' }
 *               phase_url_path: { type: string, description: 'URL path for phase resources' }
 *               phase_description: { type: string, description: 'Description of the phase' }
 *               phase_icon_path: { type: string, description: 'URL of the phase icon' }
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
const updatePhase = async (req, res, next) => {
  try {
    console.log(`Update phase request received for ID: ${req.params.id}`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let phase = await Phase.findById(req.params.id);
    if (!phase) {
      console.log(`Phase not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    // Handle file uploads and deletion of old files
    if (req.files) {
      if (req.files.phase_icon_path) {
        // Delete old icon from Cloudinary if it exists
        if (phase.phase_icon_path) {
          const publicId = phase.phase_icon_path.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
        req.body.phase_icon_path = req.files.phase_icon_path[0].path;
      }
      if (req.files.phase_url_path) {
        // Delete old url path file from Cloudinary if it exists
        if (phase.phase_url_path) {
          const publicId = phase.phase_url_path.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
        req.body.phase_url_path = req.files.phase_url_path[0].path;
      }
    }

    phase = await Phase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    console.log(`Phase with ID: ${phase._id} updated successfully`);

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
 *       404:
 *         description: Phase not found
 *       500:
 *         description: Server error
 */
const deletePhase = async (req, res, next) => {
  try {
    console.log(`Delete phase request received for ID: ${req.params.id}`);

    const phase = await Phase.findById(req.params.id);
    if (!phase) {
      console.log(`Phase not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    // Delete associated files from Cloudinary if they exist
    if (phase.phase_icon_path) {
      const publicId = phase.phase_icon_path.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }
    if (phase.phase_url_path) {
      const publicId = phase.phase_url_path.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await phase.deleteOne();
    console.log(`Phase with ID: ${req.params.id} deleted successfully`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete phase error:', error);
    next(error);
  }
};

module.exports = {
  getPhases,
  getPhase,
  createPhase,
  updatePhase,
  deletePhase
};