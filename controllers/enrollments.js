const Enrollment = require('../models/Enrollment');
const BatchCourse = require('../models/BatchCourse');
const User = require('../models/User');
const { validationResult } = require('express-validator');
require('../models/WeekComponent');
require('../models/WeekComponentContent');

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
    
    // Check if user is already enrolled in this batch course
    const existingEnrollment = await Enrollment.findOne({
      user: req.body.user,
      batch_course: req.body.batch_course,
      status: { $in: ['active', 'completed'] }
    });
    
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'User is already enrolled in this batch course'
      });
    }
    
    // Create enrollment
    const enrollmentData = {
      user: req.body.user,
      batch_course: req.body.batch_course,
      enrollment_type: req.body.enrollment_type || 'paid',
      payment_amount: req.body.payment_amount || 0,
      payment_status: req.body.payment_status || 'pending',
      enrolled_by: req.user ? req.user.id : null
    };
    
    const enrollment = await Enrollment.create(enrollmentData);
    
    // Populate the created enrollment
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('user', 'name email')
      .populate({
        path: 'batch_course',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .populate('enrolled_by', 'name');
    
    console.log(`Enrollment created successfully for user: ${populatedEnrollment.user.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: populatedEnrollment
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
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }
    
    // Update fields
    const updateFields = {};
    if (req.body.status !== undefined) updateFields.status = req.body.status;
    if (req.body.payment_status !== undefined) updateFields.payment_status = req.body.payment_status;
    if (req.body.progress_percentage !== undefined) updateFields.progress_percentage = req.body.progress_percentage;
    
    // If status is being set to completed, set completion date
    if (req.body.status === 'completed' && enrollment.status !== 'completed') {
      updateFields.completion_date = new Date();
    }
    
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
    .populate('user', 'name email')
    .populate({
      path: 'batch_course',
      populate: {
        path: 'batch',
        select: 'name'
      }
    })
    .populate('enrolled_by', 'name');
    
    console.log(`Enrollment updated successfully for user: ${updatedEnrollment.user.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      data: updatedEnrollment
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
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }
    
    await Enrollment.findByIdAndDelete(req.params.id);
    
    console.log(`Enrollment deleted successfully for ID: ${req.params.id}`);
    
    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully'
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
    
    const query = { user: req.params.userId };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
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
      .sort({ created_at: -1 });
    
    console.log(`Found ${enrollments.length} enrollments for user`);
    
    res.status(200).json({
      success: true,
      count: enrollments.length,
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
    
    const query = { batch_course: req.params.batchCourseId };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
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
      .sort({ created_at: -1 });
    
    console.log(`Found ${enrollments.length} enrollments for batch course`);
    
    res.status(200).json({
      success: true,
      count: enrollments.length,
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
 */
exports.updateEnrollmentProgress = async (req, res, next) => {
  try {
    console.log(`Update enrollment progress request received for ID: ${req.params.id}`);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }
    
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { progress_percentage: req.body.progress_percentage },
      { new: true, runValidators: true }
    )
    .populate('user', 'name email')
    .populate({
      path: 'batch_course',
      populate: {
        path: 'batch',
        select: 'name'
      }
    })
    .populate('enrolled_by', 'name');
    
    console.log(`Enrollment progress updated successfully for user: ${updatedEnrollment.user.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Enrollment progress updated successfully',
      data: updatedEnrollment
    });
  } catch (error) {
    console.error('Update enrollment progress error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/user/{userId}/enrolled-batches:
 *   get:
 *     summary: Get enrolled batches for a user with course details
 *     tags: [Enrollments]
 */
exports.getUserEnrolledBatches = async (req, res, next) => {
  try {
    console.log(`Get enrolled batches request received for user ID: ${req.params.userId}`);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Find active enrollments for the user
    const enrollments = await Enrollment.find({ 
      user: req.params.userId, 
      status: 'active' 
    })
    .populate({
      path: 'batch_course',
      populate: [
        {
          path: 'batch',
          select: 'name full_name description start_date end_date is_active batch_flyer_img status'
        },
        {
          path: 'course',
          select: 'title description thumbnail logo_url duration_months price difficulty_level status'
        }
      ]
    })
    .sort({ created_at: -1 })
    .skip(startIndex)
    .limit(limit);
    
    const total = await Enrollment.countDocuments({ 
      user: req.params.userId, 
      status: 'active' 
    });
    
    // Transform the data to match the desired format
    const enrolledBatches = enrollments.map(enrollment => {
      const batch = enrollment.batch_course.batch;
      const course = enrollment.batch_course.course;
      
      return {
        id: batch._id,
        name: batch.name,
        full_name: batch.full_name,
        description: batch.description || "",
        hash: batch._id.toString().slice(-16), // Generate a hash-like string
        batch_flyer_img: batch.batch_flyer_img || null,
        is_active: batch.is_active,
        start_date: batch.start_date ? new Date(batch.start_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : null,
        graduation_date: batch.end_date ? new Date(batch.end_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : null,
        course: {
          id: course._id,
          name: course.title,
          icon: course.logo_url || course.thumbnail || null,
          description: course.description,
          path: `/course-${course._id.toString().slice(-8)}`,
          duration: `${course.duration_months} Months`,
          hash: course._id.toString().slice(-16)
        }
      };
    });
    
    console.log(`Found ${enrolledBatches.length} enrolled batches for user`);
    
    res.status(200).json({
      success: true,
      message: "Enrolled batches retrieved successfully.",
      data: {
        enrolledBatches,
        pagination: {
          currentPage: page,
          pageSize: limit,
          total
        }
      }
    });
  } catch (error) {
    console.error('Get enrolled batches error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/user/{userId}/course/{courseId}/phases:
 *   get:
 *     summary: Get phases for a specific enrolled course
 *     tags: [Enrollments]
 */
exports.getEnrolledCoursePhases = async (req, res, next) => {
  try {
    console.log(`Get enrolled course phases request received for user ID: ${req.params.userId}, course ID: ${req.params.courseId}`);
    
    // First, get all active enrollments for the user
    const enrollments = await Enrollment.find({
      user: req.params.userId,
      status: 'active'
    }).populate({
      path: 'batch_course',
      populate: {
        path: 'course'
      }
    });
    
    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User is not enrolled in any course'
      });
    }
    
    // Find the enrollment that matches the requested course
    const requestedCourseId = req.params.courseId;
    let targetEnrollment = null;
    let targetCourse = null;
    
    for (const enrollment of enrollments) {
      if (!enrollment.batch_course.course) continue;
      
      const course = enrollment.batch_course.course;
      const courseId = course._id.toString();
      const courseHash = courseId.slice(-16);
      
      // Check if the requested course ID matches either the full ID or the hash
      if (courseId === requestedCourseId || courseHash === requestedCourseId) {
        targetEnrollment = enrollment;
        targetCourse = course;
        break;
      }
    }
    
    if (!targetEnrollment || !targetCourse) {
      return res.status(404).json({
        success: false,
        error: 'User is not enrolled in this specific course'
      });
    }
    
    console.log(`Found matching course: ${targetCourse.title} (ID: ${targetCourse._id})`);
    
    // Get phases for this course using the full course ID
    const Phase = require('../models/Phase');
    const phases = await Phase.find({ 
      course_id: targetCourse._id 
    })
    .populate('course_id', 'title description')
    .sort({ phase_order: 1 });
    
    console.log(`Found ${phases.length} phases for course: ${targetCourse.title}`);
    
    // Transform the phases to match the desired format
    const transformedPhases = phases.map(phase => ({
      id: phase._id,
      name: phase.phase_name,
      path: phase.path || `/phase-${phase.phase_order}`,
      brief_description: phase.brief_description || phase.phase_description,
      full_description: phase.full_description || phase.phase_description,
      icon: phase.icon || null,
      hash: phase.hash || phase._id.toString().slice(-16),
      has_access: true, // User is enrolled, so they have access
      order: phase.phase_order
    }));
    
    res.status(200).json({
      success: true,
      message: "Phases retrieved successfully.",
      data: {
        phases: transformedPhases,
        total: transformedPhases.length
      }
    });
  } catch (error) {
    console.error('Get enrolled course phases error:', error);
    next(error);
  }
};

/**
 * @swagger
 * enrollments/user/{userId}/phase/{phaseId}/weeks:
 *   get:
 *     summary: Get weeks for a specific phase
 *     tags: [Enrollments]
 */
exports.getPhaseWeeks = async (req, res, next) => {
  try {
    console.log(`Get phase weeks request received for user ID: ${req.params.userId}, phase ID: ${req.params.phaseId}`);

    // 1. Verify user is enrolled in a course that contains this phase
    const enrollments = await Enrollment.find({
      user: req.params.userId,
      status: 'active'
    }).populate({
      path: 'batch_course',
      populate: { path: 'course' }
    });

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User is not enrolled in any course'
      });
    }

    // 2. Get the phase and verify it belongs to an enrolled course
    const Phase = require('../models/Phase');
    const phase = await Phase.findById(req.params.phaseId).populate('course_id');
    if (!phase) {
      return res.status(404).json({
        success: false,
        error: 'Phase not found'
      });
    }

    const isEnrolled = enrollments.some(enrollment =>
      enrollment.batch_course.course._id.toString() === phase.course_id._id.toString()
    );
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        error: 'User is not enrolled in the course containing this phase'
      });
    }

    // 3. Deeply populate weeks and all nested children
    const Week = require('../models/Week');
    const weeks = await Week.find({ phase_id: req.params.phaseId })
      .sort({ week_order: 1 })
      .populate({
        path: 'week_components',
        populate: [
          { path: 'icon_type' },
          {
            path: 'week_component_contents',
            populate: { path: 'icon_type' }
          }
        ]
      })
      .populate({
        path: 'class_topics',
        populate: [
          {
            path: 'class_components',
            populate: [
              { path: 'icon_type' },
              {
                path: 'class_component_contents',
                populate: { path: 'icon_type' }
              }
            ]
          },
          {
            path: 'class_video_section_by_sections',
            populate: { path: 'class_video_watched_section_by_section_trackers' }
          },
          {
            path: 'class_video_live_sessions',
            populate: { path: 'class_video_live_session_trackers' }
          }
        ]
      })
      .lean();

    // 4. Transform the data to match your frontend contract
    const transformedWeeks = weeks.map(week => ({
      id: week._id,
      week_name: week.week_name,
      title: week.title,
      order: week.week_order,
      hash: week.hash,
      week_components: (week.week_components || []).map(wc => ({
        id: wc._id,
        week_id: wc.week_id,
        title: wc.title,
        order: wc.order,
        icon_type_id: wc.icon_type_id,
        icon_type: wc.icon_type,
        week_component_contents: (wc.week_component_contents || []).map(wcc => ({
          id: wcc._id,
          week_component_id: wcc.week_component_id,
          icon_type_id: wcc.icon_type_id,
          title: wcc.title,
          note_html: wcc.note_html,
          order: wcc.order,
          url: wcc.url,
          icon_type: wcc.icon_type
        }))
      })),
      class_topics: (week.class_topics || []).map(ct => ({
        id: ct._id,
        week_id: ct.week_id,
        title: ct.title,
        order: ct.order,
        hash: ct.hash,
        description: ct.description,
        has_checklist: ct.has_checklist,
        class_components: (ct.class_components || []).map(cc => ({
          id: cc._id,
          class_topic_id: cc.class_topic_id,
          title: cc.title,
          order: cc.order,
          icon_type_id: cc.icon_type_id,
          icon_type: cc.icon_type,
          class_component_contents: (cc.class_component_contents || []).map(ccc => ({
            id: ccc._id,
            icon_type_id: ccc.icon_type_id,
            class_component_id: ccc.class_component_id,
            title: ccc.title,
            note_html: ccc.note_html,
            order: ccc.order,
            url: ccc.url,
            icon_type: ccc.icon_type
          }))
        })),
        class_video_section_by_sections: (ct.class_video_section_by_sections || []).map(vs => ({
          id: vs._id,
          class_topic_id: vs.class_topic_id,
          title: vs.title,
          order: vs.order,
          hash: vs.hash,
          minimum_minutes_required: vs.minimum_minutes_required,
          class_video_watched_section_by_section_trackers: vs.class_video_watched_section_by_section_trackers
        })),
        class_video_live_sessions: (ct.class_video_live_sessions || []).map(ls => ({
          id: ls._id,
          class_topic_id: ls.class_topic_id,
          title: ls.title,
          hash: ls.hash,
          minimum_minutes_required: ls.minimum_minutes_required,
          video_length_minutes: ls.video_length_minutes,
          note_html: ls.note_html,
          class_video_live_session_trackers: ls.class_video_live_session_trackers
        }))
      }))
    }));

    // 5. Respond with the phase and weeks
    res.status(200).json({
      success: true,
      message: "Successfully retrieved.",
      data: {
        phase: {
          id: phase._id,
          name: phase.phase_name,
          path: phase.path,
          brief_description: phase.brief_description,
          full_description: phase.full_description,
          icon: phase.icon,
          hash: phase.hash,
          order: phase.phase_order,
          weeks: transformedWeeks
        }
      }
    });
  } catch (error) {
    console.error('Get phase weeks error:', error);
    next(error);
  }
};