const Phase = require('../models/Phase');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * /api/phases:
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
 *           enum: [order_number, start_date, end_date, created_at]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 */
exports.getPhases = async (req, res, next) => {
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
    
    // Execute query with pagination
    const phases = await Phase.find(query)
      .populate('batch_course', 'title')
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
 * /api/phases/{id}:
 *   get:
 *     summary: Get a single phase with detailed information
 *     tags: [Phases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.getPhase = async (req, res, next) => {
  try {
    console.log(`Get phase request received for ID: ${req.params.id}`);
    
    const phase = await Phase.findById(req.params.id)
      .populate('batch_course', 'title');
    
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
 * /api/phases:
 *   post:
 *     summary: Create a new phase
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 */
exports.createPhase = async (req, res, next) => {
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
    
    // Create phase
    const phase = await Phase.create(req.body);
    console.log(`Phase created with ID: ${phase._id}`);
    
    res.status(201).json({
      success: true,
      data: phase
    });
  } catch (error) {
    console.error('Create phase error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/phases/{id}:
 *   put:
 *     summary: Update a phase
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.updatePhase = async (req, res, next) => {
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
 * /api/phases/{id}:
 *   delete:
 *     summary: Delete a phase
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.deletePhase = async (req, res, next) => {
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