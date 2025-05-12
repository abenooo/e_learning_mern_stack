const Course = require('../models/Course');
const CourseInstructor = require('../models/CourseInstructor');
const { validationResult } = require('express-validator');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().populate('creator', 'name email');
    
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('creator', 'name email');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private
exports.createCourse = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Add user to req.body
    req.body.creator = req.user.id;
    
    const course = await Course.create(req.body);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private
exports.updateCourse = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Update course
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    await Course.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course instructors
// @route   GET /api/courses/:id/instructors
// @access  Public
exports.getCourseInstructors = async (req, res, next) => {
  try {
    const courseInstructors = await CourseInstructor.find({
      course: req.params.id,
      is_active: true
    }).populate('user', 'name email phone initials');
    
    res.status(200).json({
      success: true,
      count: courseInstructors.length,
      data: courseInstructors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign instructor to course
// @route   POST /api/courses/:id/instructors
// @access  Private
exports.assignInstructor = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { user, role } = req.body;
    
    // Check if course exists
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if instructor is already assigned
    const existingInstructor = await CourseInstructor.findOne({
      course: course._id,
      user
    });
    
    if (existingInstructor) {
      // If instructor exists but is inactive, reactivate
      if (!existingInstructor.is_active) {
        existingInstructor.is_active = true;
        existingInstructor.role = role;
        existingInstructor.assigned_by = req.user.id;
        existingInstructor.assigned_at = Date.now();
        await existingInstructor.save();
        
        return res.status(200).json({
          success: true,
          data: existingInstructor
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Instructor already assigned to this course'
      });
    }
    
    // Assign instructor to course
    const courseInstructor = await CourseInstructor.create({
      course: course._id,
      user,
      role,
      assigned_by: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: courseInstructor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove instructor from course
// @route   DELETE /api/courses/:id/instructors/:userId
// @access  Private
exports.removeInstructor = async (req, res, next) => {
  try {
    // Check if course exists
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Find course instructor
    const courseInstructor = await CourseInstructor.findOne({
      course: course._id,
      user: req.params.userId,
      is_active: true
    });
    
    if (!courseInstructor) {
      return res.status(404).json({
        success: false,
        error: 'Course instructor not found'
      });
    }
    
    // Deactivate instructor
    courseInstructor.is_active = false;
    courseInstructor.removed_by = req.user.id;
    courseInstructor.removed_at = Date.now();
    await courseInstructor.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};