const Course = require('../models/Course');
const CourseInstructor = require('../models/CourseInstructor');
const UserRole = require('../models/UserRole');
const { validationResult } = require('express-validator');
const { upload, cloudinary } = require('../config/cloudinary');
const User = require('../models/User');

/**
 * @swagger
 * /courses:
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
 *           enum: [price, duration_months, created_at]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Successfully retrieved courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, example: 1 }
 *                 pagination: { type: object }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Course' } }
 *       500:
 *         description: Server error
 */
const getCourses = async (req, res, next) => {
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

    // Filter by payment status
    if (req.query.payment_status) {
      query.payment_status = req.query.payment_status;
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
 * /courses/{id}:
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
const getCourse = async (req, res, next) => {
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
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: 'New Course Title' }
 *               description: { type: string, example: 'Description of the new course.' }
 *               icon: { type: string, format: url, example: 'http://example.com/icon.png' }
 *               course_icon_path: { type: string, format: url, example: 'http://example.com/icon.png' }
 *               course_url_path: { type: string, example: 'new-course-title' }
 *               price: { type: number, format: float, example: 99.99 }
 *               difficulty_level: { type: string, enum: [beginner, intermediate, advanced], example: beginner }
 *               status: { type: string, enum: [draft, published, archived], example: draft }
 *               duration_months: { type: number, example: 3 }
 *               course_type: { type: string, enum: [paid, free], example: paid }
 *               delivery_method: { type: string, enum: [online, offline, hybrid], example: online }
 *               payment_status: { type: string, enum: [pending, paid, failed], example: pending }
 *             required:
 *               - title
 *               - description
 *               - duration_months
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Course' }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const createCourse = async (req, res, next) => {
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
    
    // Handle file uploads
    if (req.files && req.files.course_icon_path) {
      req.body.course_icon_path = req.files.course_icon_path[0].path;
    }
    
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

    if (!req.body.payment_status) {
      req.body.payment_status = 'pending';
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
 * /courses/{id}:
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: 'Updated Course Title' }
 *               description: { type: string, example: 'Updated description of the course.' }
 *               icon: { type: string, format: url, example: 'http://example.com/updated_icon.png' }
 *               course_icon_path: { type: string, format: url, example: 'http://example.com/updated_icon.png' }
 *               course_url_path: { type: string, example: 'updated-course-title' }
 *               price: { type: number, format: float, example: 129.99 }
 *               difficulty_level: { type: string, enum: [beginner, intermediate, advanced], example: advanced }
 *               status: { type: string, enum: [draft, published, archived], example: published }
 *               duration_months: { type: number, example: 6 }
 *               course_type: { type: string, enum: [paid, free], example: free }
 *               delivery_method: { type: string, enum: [online, offline, hybrid], example: hybrid }
 *               payment_status: { type: string, enum: [pending, paid, failed], example: paid }
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Course' }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
const updateCourse = async (req, res, next) => {
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
    
    // Find course by ID
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      console.log(`Course not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Handle file uploads for course_icon_path and course_url_path
    if (req.files && req.files.course_icon_path) {
      req.body.course_icon_path = req.files.course_icon_path[0].path;
    }

    // Update course
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    console.log(`Course updated with ID: ${course._id}`);
    
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
 * /courses/{id}:
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
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, not authorized to delete this course
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
const deleteCourse = async (req, res, next) => {
  try {
    console.log(`Delete course request received for ID: ${req.params.id}`);

    const course = await Course.findById(req.params.id);

    if (!course) {
      console.log(`Course not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Remove course instructors associations
    await CourseInstructor.deleteMany({ course: req.params.id });

    // Delete course
    await course.deleteOne(); // Use deleteOne() for Mongoose 6+

    console.log(`Course with ID: ${req.params.id} deleted successfully`);

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
 * /courses/{id}/instructors:
 *   get:
 *     summary: Get all instructors assigned to a specific course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved course instructors
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
const getCourseInstructors = async (req, res, next) => {
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

/**
 * @swagger
 * /courses/{id}/instructors:
 *   post:
 *     summary: Assign an instructor to a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string, example: '60d0fe4f5311236168a109cc' }
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Instructor assigned successfully
 *       400:
 *         description: Bad request (e.g., user not found, user is not an instructor, instructor already assigned)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
const assignInstructor = async (req, res, next) => {
  try {
    console.log(`Assign instructor request received for course ID: ${req.params.id}`);
    const { userId } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      console.log(`Course not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found with ID: ${userId}`);
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    const isInstructor = await UserRole.findOne({ user: userId, 'role.name': 'instructor', is_active: true });
    if (!isInstructor) {
      console.log(`User ${userId} is not an active instructor`);
      return res.status(400).json({
        success: false,
        error: 'User is not an active instructor'
      });
    }

    const existingAssignment = await CourseInstructor.findOne({ course: req.params.id, user: userId });
    if (existingAssignment) {
      console.log(`Instructor ${userId} is already assigned to course ${req.params.id}`);
      return res.status(400).json({
        success: false,
        error: 'Instructor already assigned to this course'
      });
    }

    const courseInstructor = await CourseInstructor.create({
      course: req.params.id,
      user: userId,
      assigned_by: req.user.id
    });

    console.log(`Instructor ${userId} assigned to course ${req.params.id}`);

    res.status(200).json({
      success: true,
      data: courseInstructor
    });
  } catch (error) {
    console.error('Assign instructor error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /courses/{id}/instructors/{userId}:
 *   delete:
 *     summary: Remove an instructor from a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, not authorized to remove this instructor
 *       404:
 *         description: Course or instructor not found for this course
 *       500:
 *         description: Server error
 */
const removeInstructor = async (req, res, next) => {
  try {
    console.log(`Remove instructor request received for course ID: ${req.params.id}, user ID: ${req.params.userId}`);

    const courseInstructor = await CourseInstructor.findOneAndDelete({
      course: req.params.id,
      user: req.params.userId
    });

    if (!courseInstructor) {
      console.log(`Instructor ${req.params.userId} not found for course ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Instructor not found for this course'
      });
    }

    console.log(`Instructor ${req.params.userId} removed from course ${req.params.id}`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Remove instructor error:', error);
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseInstructors,
  assignInstructor,
  removeInstructor
};