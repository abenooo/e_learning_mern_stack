const LiveSession = require('../models/LiveSession');
const Week = require('../models/Week'); // Need Week to find phase/course info
const Course = require('../models/Course'); // Import Course model
const Phase = require('../models/Phase');   // Import Phase model
const Batch = require('../models/Batch');   // Import Batch model
const BatchCourse = require('../models/BatchCourse'); // Import BatchCourse model
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
 *     summary: Get all live sessions with filtering and pagination, and related academic data
 *     tags: [Live Sessions]
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: Filter live sessions by Week ID
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter live sessions by Batch ID
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter live sessions by Course ID (also triggers return of related academic data for dropdowns)
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *         description: Filter live sessions by Phase ID
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *         description: Filter live sessions by Instructor ID
 *     responses:
 *       200:
 *         description: List of live sessions with associated dropdown data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer, description: Number of filtered live sessions }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LiveSession'
 *                 dropdown_data:
 *                   type: object
 *                   properties:
 *                     batches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           name: { type: string }
 *                     phases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           title: { type: string }
 *                     weeks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           title: { type: string }
 *                           display_title: { type: string }
 *                     session_types:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Server error
 */
exports.getLiveSessions = async (req, res, next) => {
  try {
    console.log('Get all live sessions request received');
    const query = {};
    const dropdownData = {};
    let phaseIdsForWeeks = []; // Initialize here to ensure it's always defined

    // Direct filters for live sessions
    if (req.query.week) {
      query.week = req.query.week;
    }
    if (req.query.batch) {
      query.batch = req.query.batch;
    }
    if (req.query.instructor) {
      query.instructor = req.query.instructor;
    }

    // Handle filtering by Course or Phase for live sessions
    // This part also determines related data for dropdowns
    if (req.query.course || req.query.phase) {
      let weekFilter = {};
      let phaseFilter = {};

      // --- Populate Dropdown Data for Phases and Weeks based on Course ---
      if (req.query.course) {
        // Find all phases for the given course
        const relatedPhases = await Phase.find({ course: req.query.course }).select('_id title display_title');
        dropdownData.phases = relatedPhases.map(p => ({ _id: p._id, title: p.title, display_title: p.display_title }));

        phaseIdsForWeeks = relatedPhases.map(p => p._id); // `phaseIdsForWeeks` is now guaranteed to be an array
        const relatedWeeks = await Week.find({ phase: { $in: phaseIdsForWeeks } }).select('_id title display_title');
        dropdownData.weeks = relatedWeeks.map(w => ({ _id: w._id, title: w.title, display_title: w.display_title }));

        // Add Course ID to phase filter for live session query
        phaseFilter.course = req.query.course;
      }

      if (req.query.phase) {
        // If a specific phase is requested, ensure it's valid and filter dropdowns if course not specified
        if (!req.query.course && !dropdownData.phases) {
             const specificPhase = await Phase.findById(req.query.phase).select('_id title display_title');
             if(specificPhase) {
                dropdownData.phases = [{ _id: specificPhase._id, title: specificPhase.title, display_title: specificPhase.display_title }];
                const relatedWeeks = await Week.find({ phase: specificPhase._id }).select('_id title display_title');
                dropdownData.weeks = relatedWeeks.map(w => ({ _id: w._id, title: w.title, display_title: w.display_title }));
             } else {
                dropdownData.phases = [];
                dropdownData.weeks = [];
             }
        }
        weekFilter.phase = req.query.phase; // Use specific phase for week filter
      } else if (phaseFilter.course) { // This block will only run if req.query.course was true
        weekFilter.phase = phaseIdsForWeeks; // phaseIdsForWeeks is guaranteed to be defined here.
      }

      // If weekFilter has a phase defined (either from direct phase query or course's phases)
      if (weekFilter.phase && (Array.isArray(weekFilter.phase) ? weekFilter.phase.length > 0 : true)) {
          const weeksForLiveSessionQuery = await Week.find(weekFilter).select('_id');
          if (weeksForLiveSessionQuery.length === 0) {
            return res.status(200).json({ success: true, count: 0, data: [], dropdown_data: dropdownData });
          }
          const weekIdsForLiveSessionQuery = weeksForLiveSessionQuery.map(week => week._id);

          // Apply week filter to the main query
          if (query.week) {
            query.week = { $in: weekIdsForLiveSessionQuery.filter(id => id.toString() === query.week.toString()) };
            if (query.week.$in.length === 0) {
                return res.status(200).json({ success: true, count: 0, data: [], dropdown_data: dropdownData });
            }
          } else {
            query.week = { $in: weekIdsForLiveSessionQuery };
          }
      } else if (req.query.phase) { // Case where only phase is given, and no weeks found
           const existingWeek = await Week.findOne({ phase: req.query.phase });
           if (!existingWeek && query.week) { // If direct week filter also exists and doesn't match phase
               return res.status(200).json({ success: true, count: 0, data: [], dropdown_data: dropdownData });
           }
      }
    }

    // --- Populate Dropdown Data for Batches based on Course ---
    if (req.query.course) {
      const batchCourses = await BatchCourse.find({ course: req.query.course }).select('batch');
      const batchIds = batchCourses.map(bc => bc.batch);
      const relatedBatches = await Batch.find({ _id: { $in: batchIds } }).select('_id name');
      dropdownData.batches = relatedBatches.map(b => ({ _id: b._id, name: b.name }));
    }

    // --- Add static Live Session Types to dropdown data ---
    dropdownData.session_types = ['LS-1', 'LS-2'];


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
      data: liveSessions,
      dropdown_data: dropdownData // Include the new dropdown data
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