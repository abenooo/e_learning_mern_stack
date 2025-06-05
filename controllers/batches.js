const Batch = require('../models/Batch');
const BatchCourse = require('../models/BatchCourse');
const BatchUser = require('../models/BatchUser');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Batch:
 *       type: object
 *       required:
 *         - name
 *         - batch_code
 *         - full_name
 *         - start_date
 *         - end_date
 *         - created_by
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the batch
 *         name:
 *           type: string
 *           description: Name of the batch
 *         batch_code:
 *           type: string
 *           description: Unique code for the batch
 *         full_name:
 *           type: string
 *           description: Full name of the batch
 *         description:
 *           type: string
 *           description: Description of the batch
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Start date of the batch
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: End date of the batch
 *         created_by:
 *           type: string
 *           description: Reference to the user who created the batch
 *         is_active:
 *           type: boolean
 *           description: Whether the batch is active
 *           default: true
 *         max_students:
 *           type: integer
 *           description: Maximum number of students allowed
 *           default: 50
 *         meeting_link:
 *           type: string
 *           description: Link for online meetings
 *         flyer_url:
 *           type: string
 *           description: URL of the batch flyer
 *         schedule_url:
 *           type: string
 *           description: URL of the batch schedule
 *         class_days:
 *           type: string
 *           description: Days when classes are held
 *           default: "Sat & Sun"
 *         class_start_time:
 *           type: string
 *           description: Start time of classes
 *         class_end_time:
 *           type: string
 *           description: End time of classes
 *         status:
 *           type: string
 *           enum: [upcoming, active, completed]
 *           description: Current status of the batch
 *           default: upcoming
 */

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
 *           enum: [upcoming, active, completed]
 *         description: Filter by batch status
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *           enum: [start_date, end_date, created_at]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 */
exports.getBatches = async (req, res, next) => {
  try {
    console.log('Get all batches request received');
    
    // Build query
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
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
    const sortField = req.query.sort || 'created_at';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };
    
    // Execute query with pagination
    const batches = await Batch.find(query)
      .populate('created_by', 'name email')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Batch.countDocuments(query);
    
    console.log(`Found ${batches.length} batches out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: batches.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: batches
    });
  } catch (error) {
    console.error('Get batches error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/batches/{id}:
 *   get:
 *     summary: Get a single batch
 *     tags: [Batches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 */
exports.getBatch = async (req, res, next) => {
  try {
    console.log(`Get batch request received for ID: ${req.params.id}`);
    
    const batch = await Batch.findById(req.params.id)
      .populate('created_by', 'name email');
    
    if (!batch) {
      console.log(`Batch not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    console.log(`Found batch: ${batch.name}`);
    
    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Get batch error:', error);
    next(error);
  }
};

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
 *               batch_code:
 *                 type: string
 *               full_name:
 *                 type: string
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               max_students:
 *                 type: integer
 *               meeting_link:
 *                 type: string
 *               flyer_url:
 *                 type: string
 *               schedule_url:
 *                 type: string
 *               class_days:
 *                 type: string
 *               class_start_time:
 *                 type: string
 *               class_end_time:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [upcoming, active, completed]
 */
exports.createBatch = async (req, res, next) => {
  try {
    console.log('Create batch request received');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Add creator to request body
    req.body.created_by = req.user.id;
    
    // Create batch
    const batch = await Batch.create(req.body);
    
    // Populate created_by after creation
    const populatedBatch = await Batch.findById(batch._id)
      .populate('created_by', 'name email');
    
    console.log(`Batch created with ID: ${batch._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedBatch
    });
  } catch (error) {
    console.error('Create batch error:', error);
    next(error);
  }
};

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
 *         description: Batch ID
 */
exports.updateBatch = async (req, res, next) => {
  try {
    console.log(`Update batch request received for ID: ${req.params.id}`);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Find batch
    let batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      console.log(`Batch not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Update batch
    batch = await Batch.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('created_by', 'name email');
    
    console.log(`Batch updated: ${batch.name}`);
    
    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Update batch error:', error);
    next(error);
  }
};

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
 *         description: Batch ID
 */
exports.deleteBatch = async (req, res, next) => {
  try {
    console.log(`Delete batch request received for ID: ${req.params.id}`);
    
    // Find batch
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      console.log(`Batch not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Delete batch
    await Batch.findByIdAndDelete(req.params.id);
    console.log(`Batch deleted: ${batch.name}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    next(error);
  }
};

// @desc    Get batch courses
// @route   GET /api/batches/:id/courses
// @access  Public
exports.getBatchCourses = async (req, res, next) => {
  try {
    const batchCourses = await BatchCourse.find({
      batch: req.params.id,
      is_active: true
    }).populate('course', 'title description thumbnail price');
    
    res.status(200).json({
      success: true,
      count: batchCourses.length,
      data: batchCourses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add course to batch
// @route   POST /api/batches/:id/courses
// @access  Private
exports.addCourse = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { course, start_date, end_date, custom_title, custom_description } = req.body;
    
    // Check if batch exists
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Check if course is already added to batch
    const existingBatchCourse = await BatchCourse.findOne({
      batch: batch._id,
      course
    });
    
    if (existingBatchCourse) {
      // If batch course exists but is inactive, reactivate
      if (!existingBatchCourse.is_active) {
        existingBatchCourse.is_active = true;
        existingBatchCourse.start_date = start_date;
        existingBatchCourse.end_date = end_date;
        existingBatchCourse.custom_title = custom_title;
        existingBatchCourse.custom_description = custom_description;
        await existingBatchCourse.save();
        
        return res.status(200).json({
          success: true,
          data: existingBatchCourse
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Course already added to this batch'
      });
    }
    
    // Add course to batch
    const batchCourse = await BatchCourse.create({
      batch: batch._id,
      course,
      start_date,
      end_date,
      custom_title,
      custom_description
    });
    
    res.status(201).json({
      success: true,
      data: batchCourse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove course from batch
// @route   DELETE /api/batches/:id/courses/:courseId
// @access  Private
exports.removeCourse = async (req, res, next) => {
  try {
    // Check if batch exists
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Find batch course
    const batchCourse = await BatchCourse.findOne({
      batch: batch._id,
      course: req.params.courseId,
      is_active: true
    });
    
    if (!batchCourse) {
      return res.status(404).json({
        success: false,
        error: 'Batch course not found'
      });
    }
    
    // Deactivate batch course
    batchCourse.is_active = false;
    await batchCourse.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch users
// @route   GET /api/batches/:id/users
// @access  Private
exports.getBatchUsers = async (req, res, next) => {
  try {
    const batchUsers = await BatchUser.find({
      batch: req.params.id,
      is_active: true
    }).populate('user', 'name email phone initials user_id_number');
    
    res.status(200).json({
      success: true,
      count: batchUsers.length,
      data: batchUsers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add user to batch
// @route   POST /api/batches/:id/users
// @access  Private
exports.addUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { user, role, notes } = req.body;
    
    // Check if batch exists
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Check if user is already added to batch
    const existingBatchUser = await BatchUser.findOne({
      batch: batch._id,
      user
    });
    
    if (existingBatchUser) {
      // If batch user exists but is inactive, reactivate
      if (!existingBatchUser.is_active) {
        existingBatchUser.is_active = true;
        existingBatchUser.role = role;
        existingBatchUser.notes = notes;
        existingBatchUser.assigned_by = req.user.id;
        existingBatchUser.assigned_at = Date.now();
        await existingBatchUser.save();
        
        return res.status(200).json({
          success: true,
          data: existingBatchUser
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'User already added to this batch'
      });
    }
    
    // Add user to batch
    const batchUser = await BatchUser.create({
      batch: batch._id,
      user,
      role,
      notes,
      assigned_by: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: batchUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove user from batch
// @route   DELETE /api/batches/:id/users/:userId
// @access  Private
exports.removeUser = async (req, res, next) => {
  try {
    // Check if batch exists
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Find batch user
    const batchUser = await BatchUser.findOne({
      batch: batch._id,
      user: req.params.userId,
      is_active: true
    });
    
    if (!batchUser) {
      return res.status(404).json({
        success: false,
        error: 'Batch user not found'
      });
    }
    
    // Deactivate batch user
    batchUser.is_active = false;
    batchUser.removed_by = req.user.id;
    batchUser.removed_at = Date.now();
    await batchUser.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};