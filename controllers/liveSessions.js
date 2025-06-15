const LiveSession = require('../models/LiveSession');
const Week = require('../models/Week'); // Need Week to find phase/course info
const { validationResult } = require('express-validator');
const mongoose = require('mongoose'); // Import mongoose for model access

/**
 * @swagger
 * components:
 *   schemas:
 *     LiveSession:
 *       type: object
 *       required:
 *         - week
 *         - batch
 *         - instructor
 *         - title
 *         - session_date
 *         - start_time
 *         - end_time
 *         - meeting_link
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the live session
 *         week:
 *           type: string
 *           description: Reference to the Week ID
 *         batch:
 *           type: string
 *           description: Reference to the Batch ID
 *         instructor:
 *           type: string
 *           description: Reference to the User (Instructor) ID
 *         title:
 *           type: string
 *           description: Title of the live session
 *         description:
 *           type: string
 *           description: Description of the live session
 *         session_date:
 *           type: string
 *           format: date-time
 *           description: Date of the live session (ISO 8601 format)
 *         start_time:
 *           type: string
 *           description: Start time of the live session (e.g., "10:00 AM")
 *         end_time:
 *           type: string
 *           description: End time of the live session (e.g., "12:00 PM")
 *         meeting_link:
 *           type: string
 *           description: Zoom Meeting Link
 *         recording_url:
 *           type: string
 *           description: URL of the session recording
 *         session_type:
 *           type: string
 *           enum: [LS-1, LS-2]
 *           description: Type of live session
 *         is_full_class:
 *           type: boolean
 *           description: Whether it's a full class session
 *         is_active:
 *           type: boolean
 *           description: Whether the session is active
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *           description: Current status of the session
 */

/**
 * @swagger
 * /live-sessions:
 *   get:
 *     summary: Get all live sessions with filtering and pagination
 *     tags: [Live Sessions]
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: Filter by Week ID
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter by Batch ID
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by Course ID (live sessions belong to weeks which belong to phases, which belong to courses)
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *         description: Filter by Phase ID (live sessions belong to weeks which belong to phases)
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *         description: Filter by Instructor ID
 *     responses:
 *       200:
 *         description: List of live sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LiveSession'
 *       500:
 *         description: Server error
 */
exports.getLiveSessions = async (req, res, next) => {
  try {
    // console.log('Get all live sessions request received');
    const query = {};

    // Direct filters for week, batch, and instructor
    if (req.query.week) {
      query.week = req.query.week;
    }
    if (req.query.batch) {
      query.batch = req.query.batch;
    }
    if (req.query.instructor) {
      query.instructor = req.query.instructor;
    }

    // Handle filtering by Course or Phase, which affects 'week'
    if (req.query.course || req.query.phase) {
      let weekFilter = {};

      if (req.query.course) {
        const phasesInCourse = await mongoose.model('Phase').find({ course: req.query.course }).select('_id');
        if (phasesInCourse.length === 0) {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
        weekFilter.phase = { $in: phasesInCourse.map(phase => phase._id) };
      }

      if (req.query.phase) {
        if (weekFilter.phase) {
          if (!weekFilter.phase.$in.map(id => id.toString()).includes(req.query.phase)) {
            return res.status(200).json({ success: true, count: 0, data: [] });
          }
          weekFilter.phase = req.query.phase;
        } else {
          weekFilter.phase = req.query.phase;
        }
      }

      const weeks = await Week.find(weekFilter).select('_id');
      if (weeks.length === 0) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      const weekIds = weeks.map(week => week._id);

      if (query.week) {
        query.week = { $in: weekIds.filter(id => id.toString() === query.week.toString()) };
        if (query.week.$in.length === 0) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }
      } else {
        query.week = { $in: weekIds };
      }
    }

    const liveSessions = await LiveSession.find(query)
      .populate({
        path: 'week',
        select: 'title display_title phase',
        populate: {
          path: 'phase',
          select: 'title display_title course',
          populate: {
            path: 'course',
            select: 'title'
          }
        }
      })
      .populate('batch', 'name')
      .populate('instructor', 'name email avatar user_id_number'); // Add avatar and user_id_number

    res.status(200).json({
      success: true,
      count: liveSessions.length,
      data: liveSessions
    });
  } catch (error) {
    console.error('Get live sessions error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /live-sessions:
 *   post:
 *     summary: Create a new live session
 *     tags: [Live Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - week
 *               - batch
 *               - instructor
 *               - title
 *               - session_date
 *               - start_time
 *               - end_time
 *               - meeting_link
 *             properties:
 *               week:
 *                 type: string
 *                 description: ID of the Week
 *               batch:
 *                 type: string
 *                 description: ID of the Batch
 *               instructor:
 *                 type: string
 *                 description: ID of the Instructor (User)
 *               title:
 *                 type: string
 *                 description: Title of the live session (e.g., "Lecture 1")
 *               description:
 *                 type: string
 *                 description: Description of the live session
 *               session_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date of the live session
 *               start_time:
 *                 type: string
 *                 description: Start time
 *               end_time:
 *                 type: string
 *                 description: End time
 *               meeting_link:
 *                 type: string
 *                 description: Zoom Meeting Link
 *               recording_url:
 *                 type: string
 *                 description: URL for the session recording
 *               session_type:
 *                 type: string
 *                 enum: [LS-1, LS-2]
 *               is_full_class:
 *                 type: boolean
 *               is_active:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [scheduled, in_progress, completed, cancelled]
 *     responses:
 *       201:
 *         description: Live session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/LiveSession'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
exports.createLiveSession = async (req, res, next) => {
  try {
    console.log('Create live session request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const liveSession = await LiveSession.create(req.body);

    const populatedLiveSession = await LiveSession.findById(liveSession._id)
      .populate({
        path: 'week',
        select: 'title display_title phase',
        populate: {
          path: 'phase',
          select: 'title display_title course',
          populate: {
            path: 'course',
            select: 'title'
          }
        }
      })
      .populate('batch', 'name')
      .populate('instructor', 'name email avatar user_id_number'); // Add avatar and user_id_number

    res.status(201).json({
      success: true,
      data: populatedLiveSession
    });
  } catch (error) {
    console.error('Create live session error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /live-sessions/{id}:
 *   get:
 *     summary: Get a single live session by ID
 *     tags: [Live Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Live Session ID
 *     responses:
 *       200:
 *         description: Live Session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/LiveSession'
 *       404:
 *         description: Live Session not found
 *       500:
 *         description: Server error
 */
exports.getLiveSession = async (req, res, next) => {
  try {
    console.log(`Get live session request received for ID: ${req.params.id}`);
    const liveSession = await LiveSession.findById(req.params.id)
      .populate({
        path: 'week',
        select: 'title display_title phase',
        populate: {
          path: 'phase',
          select: 'title display_title course',
          populate: {
            path: 'course',
            select: 'title'
          }
        }
      })
      .populate('batch', 'name')
      .populate('instructor', 'name email avatar user_id_number'); // Add avatar and user_id_number

    if (!liveSession) {
      return res.status(404).json({ success: false, error: 'Live Session not found' });
    }

    res.status(200).json({ success: true, data: liveSession });
  } catch (error) {
    console.error('Get single live session error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /live-sessions/{id}:
 *   put:
 *     summary: Update an existing live session by ID
 *     tags: [Live Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Live Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               week: { type: string, description: ID of the Week }
 *               batch: { type: string, description: ID of the Batch }
 *               instructor: { type: string, description: ID of the Instructor (User) }
 *               title: { type: string, description: Title of the live session }
 *               description: { type: string, description: Description of the live session }
 *               session_date: { type: string, format: date-time, description: Date of the live session }
 *               start_time: { type: string, description: Start time }
 *               end_time: { type: string, description: End time }
 *               meeting_link: { type: string, description: Zoom Meeting Link }
 *               recording_url: { type: string, description: URL of the recording }
 *               session_type: { type: string, enum: [LS-1, LS-2] }
 *               is_full_class: { type: boolean }
 *               is_active: { type: boolean }
 *               status: { type: string, enum: [scheduled, in_progress, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Live Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/LiveSession'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Live Session not found
 *       500:
 *         description: Server error
 */
exports.updateLiveSession = async (req, res, next) => {
  try {
    console.log(`Update live session request received for ID: ${req.params.id}`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let liveSession = await LiveSession.findById(req.params.id);
    if (!liveSession) {
      return res.status(404).json({ success: false, error: 'Live Session not found' });
    }

    liveSession = await LiveSession.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate({
        path: 'week',
        select: 'title display_title phase',
        populate: {
          path: 'phase',
          select: 'title display_title course',
          populate: {
            path: 'course',
            select: 'title'
          }
        }
      })
      .populate('batch', 'name')
      .populate('instructor', 'name email avatar user_id_number'); // Add avatar and user_id_number

    res.status(200).json({ success: true, data: liveSession });
  } catch (error) {
    console.error('Update live session error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /live-sessions/{id}:
 *   delete:
 *     summary: Delete a live session by ID
 *     tags: [Live Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Live Session ID
 *     responses:
 *       200:
 *         description: Live Session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Live Session not found
 *       500:
 *         description: Server error
 */
exports.deleteLiveSession = async (req, res, next) => {
  try {
    console.log(`Delete live session request received for ID: ${req.params.id}`);
    const liveSession = await LiveSession.findById(req.params.id);
    if (!liveSession) {
      return res.status(404).json({ success: false, error: 'Live Session not found' });
    }

    await liveSession.remove(); // Use .remove() for Mongoose delete hooks if any, otherwise findByIdAndDelete

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete live session error:', error);
    next(error);
  }
}; 