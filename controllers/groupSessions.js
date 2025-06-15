const GroupSession = require('../models/GroupSession');
const Week = require('../models/Week'); // To link to Phase and Course
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     GroupSession:
 *       type: object
 *       required:
 *         - week
 *         - group
 *         - instructor
 *         - title
 *         - session_date
 *         - start_time
 *         - end_time
 *         - meeting_link
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the group session
 *         week:
 *           type: string
 *           description: Reference to the Week ID
 *         group:
 *           type: string
 *           description: Reference to the Group ID
 *         instructor:
 *           type: string
 *           description: Reference to the User (Instructor) ID
 *         title:
 *           type: string
 *           description: Title of the group session
 *         description:
 *           type: string
 *           description: Description of the group session
 *         session_date:
 *           type: string
 *           format: date-time
 *           description: Date of the group session (ISO 8601 format)
 *         start_time:
 *           type: string
 *           description: Start time of the group session (e.g., "10:00 AM")
 *         end_time:
 *           type: string
 *           description: End time of the group session (e.g., "12:00 PM")
 *         meeting_link:
 *           type: string
 *           description: Zoom Meeting Link
 *         recording_url:
 *           type: string
 *           description: URL of the session recording
 *         session_type:
 *           type: string
 *           enum: [GS-1, GS-2]
 *           description: Type of group session
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
 * /group-sessions:
 *   get:
 *     summary: Get all group sessions with filtering and pagination
 *     tags: [Group Sessions]
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: Filter by Week ID
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *         description: Filter by Group ID
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter by Batch ID (group sessions belong to groups which belong to batches)
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *         description: Filter by Phase ID (group sessions belong to weeks which belong to phases)
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by Course ID (group sessions belong to weeks which belong to phases, which belong to courses)
 *     responses:
 *       200:
 *         description: List of group sessions
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
 *                     $ref: '#/components/schemas/GroupSession'
 *       500:
 *         description: Server error
 */
exports.getGroupSessions = async (req, res, next) => {
  try {
    console.log('Get all group sessions request received');
    const query = {};

    // Direct filters for week and group
    if (req.query.week) {
      query.week = req.query.week;
    }
    if (req.query.group) {
      query.group = req.query.group;
    }

    // Handle filtering by Course or Phase, which affects 'week'
    if (req.query.course || req.query.phase) {
      let weekFilter = {};

      if (req.query.course) {
        // Find phases for the given course
        const phasesInCourse = await mongoose.model('Phase').find({ course: req.query.course }).select('_id');
        if (phasesInCourse.length === 0) {
          // If no phases found for the course, return empty array early
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
        weekFilter.phase = { $in: phasesInCourse.map(phase => phase._id) };
      }

      if (req.query.phase) {
        if (weekFilter.phase) {
          // If both course and phase are provided, ensure the phase is in the course's phases
          if (!weekFilter.phase.$in.map(id => id.toString()).includes(req.query.phase)) {
            return res.status(200).json({ success: true, count: 0, data: [] });
          }
          // If already filtered by course and phase, just keep the specific phase
          weekFilter.phase = req.query.phase;
        } else {
          weekFilter.phase = req.query.phase;
        }
      }

      // Find weeks based on the constructed weekFilter
      const weeks = await Week.find(weekFilter).select('_id');
      if (weeks.length === 0) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      const weekIds = weeks.map(week => week._id);

      // Apply week filter to the main query
      if (query.week) {
        // If week was already filtered directly, intersect the two lists
        query.week = { $in: weekIds.filter(id => id.toString() === query.week.toString()) };
        if (query.week.$in.length === 0) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }
      } else {
        query.week = { $in: weekIds };
      }
    }

    // Handle filtering by Batch, which affects 'group'
    if (req.query.batch) {
      const groupsInBatch = await mongoose.model('Group').find({ batch: req.query.batch }).select('_id');
      if (groupsInBatch.length === 0) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      const groupIds = groupsInBatch.map(group => group._id);

      // Apply group filter to the main query
      if (query.group) {
        // If group was already filtered directly, intersect the two lists
        query.group = { $in: groupIds.filter(id => id.toString() === query.group.toString()) };
        if (query.group.$in.length === 0) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }
      } else {
        query.group = { $in: groupIds };
      }
    }


    const groupSessions = await GroupSession.find(query)
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
      .populate({
        path: 'group',
        select: 'name batch',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .populate('instructor', 'name email avatar user_id_number'); // Add avatar and user_id_number for 'Created By'

    res.status(200).json({
      success: true,
      count: groupSessions.length,
      data: groupSessions
    });
  } catch (error) {
    console.error('Get group sessions error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /group-sessions:
 *   post:
 *     summary: Create a new group session
 *     tags: [Group Sessions]
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
 *               - group
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
 *               group:
 *                 type: string
 *                 description: ID of the Group
 *               instructor:
 *                 type: string
 *                 description: ID of the Instructor (User)
 *               title:
 *                 type: string
 *                 description: Title of the group session (e.g., "Discussion Session")
 *               description:
 *                 type: string
 *                 description: Description of the group session
 *               session_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date of the group session
 *               start_time:
 *                 type: string
 *                 description: Start time of the group session
 *               end_time:
 *                 type: string
 *                 description: End time of the group session
 *               meeting_link:
 *                 type: string
 *                 description: Zoom Meeting Link
 *               recording_url:
 *                 type: string
 *                 description: URL for the session recording
 *               session_type:
 *                 type: string
 *                 enum: [GS-1, GS-2]
 *               is_active:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [scheduled, in_progress, completed, cancelled]
 *     responses:
 *       201:
 *         description: Group session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/GroupSession'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
exports.createGroupSession = async (req, res, next) => {
  try {
    console.log('Create group session request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const groupSession = await GroupSession.create(req.body);

    const populatedGroupSession = await GroupSession.findById(groupSession._id)
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
      .populate({
        path: 'group',
        select: 'name batch',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .populate('instructor', 'name email');

    res.status(201).json({
      success: true,
      data: populatedGroupSession
    });
  } catch (error) {
    console.error('Create group session error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /group-sessions/{id}:
 *   get:
 *     summary: Get a single group session by ID
 *     tags: [Group Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group Session ID
 *     responses:
 *       200:
 *         description: Group Session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/GroupSession'
 *       404:
 *         description: Group Session not found
 *       500:
 *         description: Server error
 */
exports.getGroupSession = async (req, res, next) => {
  try {
    console.log(`Get group session request received for ID: ${req.params.id}`);
    const groupSession = await GroupSession.findById(req.params.id)
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
      .populate({
        path: 'group',
        select: 'name batch',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .populate('instructor', 'name email');

    if (!groupSession) {
      return res.status(404).json({ success: false, error: 'Group Session not found' });
    }

    res.status(200).json({ success: true, data: groupSession });
  } catch (error) {
    console.error('Get single group session error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /group-sessions/{id}:
 *   put:
 *     summary: Update an existing group session by ID
 *     tags: [Group Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               week: { type: string, description: ID of the Week }
 *               group: { type: string, description: ID of the Group }
 *               instructor: { type: string, description: ID of the Instructor (User) }
 *               title: { type: string, description: Title of the group session }
 *               description: { type: string, description: Description of the group session }
 *               session_date: { type: string, format: date-time, description: Date of the group session }
 *               start_time: { type: string, description: Start time }
 *               end_time: { type: string, description: End time }
 *               meeting_link: { type: string, description: Zoom Meeting Link }
 *               recording_url: { type: string, description: URL of the recording }
 *               session_type: { type: string, enum: [GS-1, GS-2] }
 *               is_active: { type: boolean }
 *               status: { type: string, enum: [scheduled, in_progress, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Group Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/GroupSession'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group Session not found
 *       500:
 *         description: Server error
 */
exports.updateGroupSession = async (req, res, next) => {
  try {
    console.log(`Update group session request received for ID: ${req.params.id}`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let groupSession = await GroupSession.findById(req.params.id);
    if (!groupSession) {
      return res.status(404).json({ success: false, error: 'Group Session not found' });
    }

    groupSession = await GroupSession.findByIdAndUpdate(req.params.id, req.body, {
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
      .populate({
        path: 'group',
        select: 'name batch',
        populate: {
          path: 'batch',
          select: 'name'
        }
      })
      .populate('instructor', 'name email');

    res.status(200).json({ success: true, data: groupSession });
  } catch (error) {
    console.error('Update group session error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /group-sessions/{id}:
 *   delete:
 *     summary: Delete a group session by ID
 *     tags: [Group Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group Session ID
 *     responses:
 *       200:
 *         description: Group Session deleted successfully
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
 *         description: Group Session not found
 *       500:
 *         description: Server error
 */
exports.deleteGroupSession = async (req, res, next) => {
  try {
    console.log(`Delete group session request received for ID: ${req.params.id}`);
    const groupSession = await GroupSession.findById(req.params.id);
    if (!groupSession) {
      return res.status(404).json({ success: false, error: 'Group Session not found' });
    }

    await groupSession.remove(); // Use .remove() for Mongoose delete hooks if any, otherwise findByIdAndDelete

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete group session error:', error);
    next(error);
  }
}; 