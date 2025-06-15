const Course = require('../models/Course');
const Phase = require('../models/Phase');
const Week = require('../models/Week');
const Class = require('../models/Class');
const LiveSession = require('../models/LiveSession');
const GroupSession = require('../models/GroupSession');
const Batch = require('../models/Batch');
const BatchCourse = require('../models/BatchCourse');

/**
 * @swagger
 * /api/course-hierarchy:
 *   get:
 *     summary: Get hierarchical view of courses, phases, weeks, and sessions
 *     tags: [Course Hierarchy]
 *     parameters:
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Course ID to filter by
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Batch ID to filter by
 *     responses:
 *       200:
 *         description: Hierarchical course data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       phases:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             display_title:
 *                               type: string
 *                             weeks:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   title:
 *                                     type: string
 *                                   display_title:
 *                                     type: string
 *                                   topics:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         _id:
 *                                           type: string
 *                                         title:
 *                                           type: string
 *                                         hash:
 *                                           type: string
 *                                   live_sessions:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         _id:
 *                                           type: string
 *                                         title:
 *                                           type: string
 *                                         session_date:
 *                                           type: string
 *                                         start_time:
 *                                           type: string
 *                                         end_time:
 *                                           type: string
 *                                         status:
 *                                           type: string
 *                                   group_sessions:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         _id:
 *                                           type: string
 *                                         title:
 *                                           type: string
 *                                         session_date:
 *                                           type: string
 *                                         start_time:
 *                                           type: string
 *                                         end_time:
 *                                           type: string
 *                                         status:
 *                                           type: string
 */
exports.getCourseHierarchy = async (req, res, next) => {
  try {
    console.log('Get course hierarchy request received');
    
    const query = {};
    if (req.query.course) {
      query._id = req.query.course;
    }

    // Get courses with basic info
    const courses = await Course.find(query)
      .select('_id title')
      .lean();

    // For each course, get its phases
    for (const course of courses) {
      // Get batches associated with the course
      const batchCourses = await BatchCourse.find({ course: course._id })
        .populate('batch', 'name')
        .select('batch')
        .lean();
      
      course.batches = batchCourses.map(bc => bc.batch);

      const phases = await Phase.find({ course: course._id })
        .select('_id title display_title')
        .lean();

      course.phases = phases;

      // For each phase, get its weeks
      for (const phase of course.phases) {
        const weeks = await Week.find({ phase: phase._id })
          .select('_id title display_title')
          .lean();

        phase.weeks = weeks;

        // For each week, get its topics (classes) and sessions
        for (const week of phase.weeks) {
          // Get topics (classes)
          const topics = await Class.find({ week: week._id })
            .select('_id title')
            .lean();

          // Add hash to each topic (using _id as hash for now)
          topics.forEach(topic => {
            topic.hash = topic._id.toString();
          });

          week.topics = topics;

          // Get live sessions
          const liveSessions = await LiveSession.find({ week: week._id })
            .select('_id title session_date start_time end_time status')
            .lean();

          week.live_sessions = liveSessions;

          // Get group sessions
          const groupSessions = await GroupSession.find({ week: week._id })
            .select('_id title session_date start_time end_time status')
            .lean();

          week.group_sessions = groupSessions;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get course hierarchy error:', error);
    next(error);
  }
};
