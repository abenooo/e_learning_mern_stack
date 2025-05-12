const Batch = require('../models/Batch');
const BatchCourse = require('../models/BatchCourse');
const BatchUser = require('../models/BatchUser');
const { validationResult } = require('express-validator');

// @desc    Get all batches
// @route   GET /api/batches
// @access  Public
exports.getBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find().populate('created_by', 'name email');
    
    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Public
exports.getBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('created_by', 'name email');
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create batch
// @route   POST /api/batches
// @access  Private
exports.createBatch = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Add user to req.body
    req.body.created_by = req.user.id;
    
    const batch = await Batch.create(req.body);
    
    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private
exports.updateBatch = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    let batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Update batch
    batch = await Batch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private
exports.deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    await Batch.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
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