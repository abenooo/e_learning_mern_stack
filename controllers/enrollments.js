const Enrollment = require('../models/Enrollment');
const BatchCourse = require('../models/BatchCourse');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * enrollments:
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
 *           enum: [pending, paid, failed]
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
 */
exports.getEnrollments = async (req, res, next) => {
  try {
    console.log('Get all enrollments request received');
    
    // Build query
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by enrollment type
    if (req.query.enrollment_type) {
      query.enrollment_type = req.query.enrollment_type;
    }
    
    // Filter by payment status
    if (req.query.payment_status) {
      query.payment_status = req.query.payment_status;
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
    const enrollments = await Enrollment.find(query)
      .populate('user', 'name email')
      .populate({
        path: 'batch_course',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .populate('enrolled_by', 'name')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Enrollment.countDocuments(query);
    
    console.log(`Found ${enrollments.length} enrollments out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: enrollments.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/{id}:
 *   get:
 *     summary: Get a single enrollment with detailed information
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.getEnrollment = async (req, res, next) => {
  try {
    console.log(`Get enrollment request received for ID: ${req.params.id}`);
    
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'batch_course',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .populate('enrolled_by', 'name');
    
    if (!enrollment) {
      console.log(`Enrollment not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }
    
    console.log(`Found enrollment for user: ${enrollment.user.name}`);
    
    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments:
 *   post:
 *     summary: Create a new enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
exports.createEnrollment = async (req, res, next) => {
  try {
    console.log('Create enrollment request received');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Check if user exists
    const user = await User.findById(req.body.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if batch course exists
    const batchCourse = await BatchCourse.findById(req.body.batch_course);
    if (!batchCourse) {
      return res.status(404).json({
        success: false,
        error: 'Batch course not found'
      });
    }
    
    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.body.user,
      batch_course: req.body.batch_course
    });
    
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'User is already enrolled in this batch course'
      });
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({
      ...req.body,
      enrolled_by: req.user.id
    });
    
    console.log(`Enrollment created with ID: ${enrollment._id}`);
    
    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Create enrollment error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/{id}:
 *   put:
 *     summary: Update an enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
exports.updateEnrollment = async (req, res, next) => {
  try {
    console.log(`Update enrollment request received for ID: ${req.params.id}`);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      console.log(`Enrollment not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }
    
    // If status is being updated to completed, set completion_date
    if (req.body.status === 'completed' && !enrollment.completion_date) {
      req.body.completion_date = Date.now();
    }
    
    enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email')
      .populate({
        path: 'batch_course',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .populate('enrolled_by', 'name');
    
    console.log(`Enrollment updated for user: ${enrollment.user.name}`);
    
    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Update enrollment error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/{id}:
 *   delete:
 *     summary: Delete an enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
exports.deleteEnrollment = async (req, res, next) => {
  try {
    console.log(`Delete enrollment request received for ID: ${req.params.id}`);
    
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      console.log(`Enrollment not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }
    
    await enrollment.remove();
    
    console.log(`Enrollment deleted for user: ${enrollment.user.name}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/user/{userId}:
 *   get:
 *     summary: Get all enrollments for a user
 *     tags: [Enrollments]
 */
exports.getUserEnrollments = async (req, res, next) => {
  try {
    console.log(`Get user enrollments request received for user ID: ${req.params.userId}`);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    let query = { user: req.params.userId };
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'batch_course',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(startIndex);
    
    const total = await Enrollment.countDocuments(query);
    
    console.log(`Found ${enrollments.length} enrollments for user`);
    
    res.status(200).json({
      success: true,
      count: enrollments.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: enrollments
    });
  } catch (error) {
    console.error('Get user enrollments error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/batch-course/{batchCourseId}:
 *   get:
 *     summary: Get all enrollments for a batch course
 *     tags: [Enrollments]
 */
exports.getBatchCourseEnrollments = async (req, res, next) => {
  try {
    console.log(`Get batch course enrollments request received for batch course ID: ${req.params.batchCourseId}`);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    let query = { batch_course: req.params.batchCourseId };
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const enrollments = await Enrollment.find(query)
      .populate('user', 'name email')
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(startIndex);
    
    const total = await Enrollment.countDocuments(query);
    
    console.log(`Found ${enrollments.length} enrollments for batch course`);
    
    res.status(200).json({
      success: true,
      count: enrollments.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: enrollments
    });
  } catch (error) {
    console.error('Get batch course enrollments error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/{id}/progress:
 *   patch:
 *     summary: Update enrollment progress
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
exports.updateEnrollmentProgress = async (req, res, next) => {
  try {
    console.log(`Update enrollment progress request received for ID: ${req.params.id}`);
    
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      console.log(`Enrollment not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }
    
    if (req.body.progress_percentage < 0 || req.body.progress_percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress percentage must be between 0 and 100'
      });
    }
    
    enrollment.progress_percentage = req.body.progress_percentage;
    await enrollment.save();
    
    console.log(`Progress updated for enrollment: ${enrollment._id}`);
    
    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Update enrollment progress error:', error);
    next(error);
  }
};