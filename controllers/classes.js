const Class = require('../models/Class');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes with filtering and pagination
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: Filter by week ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [lecture, workshop, assessment]
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
 *           enum: [order_number, created_at]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 */
exports.getClasses = async (req, res, next) => {
  try {
    console.log('Get all classes request received');
    
    // Build query
    const query = {};
    
    // Filter by week
    if (req.query.week) {
      query.week = req.query.week;
    }
    
    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
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
    const classes = await Class.find(query)
      .populate('week', 'title')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Class.countDocuments(query);
    
    console.log(`Found ${classes.length} classes out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: classes.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get a single class
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.getClass = async (req, res, next) => {
  try {
    console.log(`Get class request received for ID: ${req.params.id}`);
    
    const classData = await Class.findById(req.params.id)
      .populate('week', 'title');
    
    if (!classData) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }
    
    console.log(`Found class: ${classData.title}`);
    
    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Get class error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 */
exports.createClass = async (req, res, next) => {
  try {
    console.log('Create class request received');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Create class
    const classData = await Class.create(req.body);
    
    // Populate week after creation
    const populatedClass = await Class.findById(classData._id)
      .populate('week', 'title');
    
    console.log(`Class created with ID: ${classData._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 */
exports.updateClass = async (req, res, next) => {
  try {
    console.log(`Update class request received for ID: ${req.params.id}`);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let classData = await Class.findById(req.params.id);
    
    if (!classData) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }
    
    classData = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('week', 'title');
    
    console.log(`Class updated: ${classData.title}`);
    
    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Update class error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 */
exports.deleteClass = async (req, res, next) => {
  try {
    console.log(`Delete class request received for ID: ${req.params.id}`);
    
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }
    
    await Class.findByIdAndDelete(req.params.id);
    console.log(`Class deleted: ${classData.title}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete class error:', error);
    next(error);
  }
}; 