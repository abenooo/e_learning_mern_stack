const Course = require('../models/Course');
const CourseInstructor = require('../models/CourseInstructor');
const UserRole = require('../models/UserRole');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses with filtering and pagination
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: difficulty_level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: course_type
 *         schema:
 *           type: string
 *           enum: [paid, free]
 *       - in: query
 *         name: delivery_method
 *         schema:
 *           type: string
 *           enum: [online, offline, hybrid]
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
 *           enum: [price, duration_months, created_at]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 */
exports.getCourses = async (req, res, next) => {
  try {
    console.log('Get all courses request received');
    
    // Build query
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by difficulty level
    if (req.query.difficulty_level) {
      query.difficulty_level = req.query.difficulty_level;
    }
    
    // Filter by course type
    if (req.query.course_type) {
      query.course_type = req.query.course_type;
    }
    
    // Filter by delivery method
    if (req.query.delivery_method) {
      query.delivery_method = req.query.delivery_method;
    }
    
    // Filter active courses by default
    query.is_active = true;
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Sorting
    const sortField = req.query.sort || 'created_at';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };
    
    // Execute query with pagination
    const courses = await Course.find(query)
      .populate('creator', 'name email')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Course.countDocuments(query);
    
    console.log(`Found ${courses.length} courses out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: courses.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a single course with detailed information
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.getCourse = async (req, res, next) => {
  try {
    console.log(`Get course request received for ID: ${req.params.id}`);
    
    // Get course with creator details
    const course = await Course.findById(req.params.id)
      .populate('creator', 'name email');
    
    if (!course) {
      console.log(`Course not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Get course instructors
    const instructors = await CourseInstructor.find({
      course: course._id,
      is_active: true
    }).populate('user', 'name email phone initials');
    
    console.log(`Found course: ${course.title} with ${instructors.length} instructors`);
    
    res.status(200).json({
      success: true,
      data: {
        course,
        instructors
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
exports.createCourse = async (req, res, next) => {
  try {
    console.log('Create course request received');
    
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
    req.body.creator = req.user.id;
    
    // Set default values if not provided
    if (!req.body.status) {
      req.body.status = 'draft';
    }
    
    if (!req.body.difficulty_level) {
      req.body.difficulty_level = 'beginner';
    }
    
    if (!req.body.course_type) {
      req.body.course_type = 'paid';
    }
    
    if (!req.body.delivery_method) {
      req.body.delivery_method = 'online';
    }
    
    // Create course
    const course = await Course.create(req.body);
    console.log(`Course created with ID: ${course._id}`);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.updateCourse = async (req, res, next) => {
  try {
    console.log(`Update course request received for ID: ${req.params.id}`);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Find course
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      console.log(`Course not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if user is authorized to update
    const userRoles = await UserRole.find({ 
      user: req.user.id,
      is_active: true
    }).populate('role');

    const isAdmin = userRoles.some(userRole => 
      userRole.role.name === 'admin' || userRole.role.name === 'super_admin'
    );

    if (course.creator.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this course'
      });
    }
    
    // Prevent updating certain fields if course is published
    // if (course.status === 'published') {
    //   const restrictedFields = ['price', 'course_type', 'duration_months'];
    //   for (const field of restrictedFields) {
    //     if (req.body[field] !== undefined && req.body[field] !== course[field]) {
    //       return res.status(400).json({
    //         success: false,
    //         error: `Cannot update ${field} for a published course`
    //       });
    //     }
    //   }
    // }
    
    // Update course
    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    console.log(`Course updated: ${course.title}`);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    console.log(`Delete course request received for ID: ${req.params.id}`);
    
    // Find course
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      console.log(`Course not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if user is authorized to delete
    const userRoles = await UserRole.find({ 
      user: req.user.id,
      is_active: true
    }).populate('role');

    const isAdmin = userRoles.some(userRole => 
      userRole.role.name === 'admin' || userRole.role.name === 'super_admin'
    );

    if (course.creator.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this course'
      });
    }
    
    // Check if course is published
    // if (course.status === 'published') {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Cannot delete a published course. Archive it instead.'
    //   });
    // }
    
    // Delete course
    await Course.findByIdAndDelete(req.params.id);
    console.log(`Course deleted: ${course.title}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete course error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/courses/{id}/instructors:
 *   get:
 *     summary: Get course instructors
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
exports.getCourseInstructors = async (req, res, next) => {
  try {
    console.log(`Get course instructors request received for course ID: ${req.params.id}`);
    
    // Check if course exists
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      console.log(`Course not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Get active instructors
    const courseInstructors = await CourseInstructor.find({
      course: req.params.id,
      is_active: true
    }).populate('user', 'name email phone initials');
    
    console.log(`Found ${courseInstructors.length} instructors for course: ${course.title}`);
    
    res.status(200).json({
      success: true,
      count: courseInstructors.length,
      data: courseInstructors
    });
  } catch (error) {
    console.error('Get course instructors error:', error);
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