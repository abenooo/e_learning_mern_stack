const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivityLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the activity log
 *         user:
 *           type: string
 *           description: Reference to the User ID who performed the action
 *         action:
 *           type: string
 *           description: Type of action performed (e.g., 'login', 'create', 'update')
 *         entity_type:
 *           type: string
 *           description: Type of entity affected (e.g., 'User', 'Course')
 *         entity_id:
 *           type: string
 *           description: ID of the entity affected
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: The date and time the activity occurred
 *         ip_address:
 *           type: string
 *           description: IP address from where the action originated (IPv4 or IPv6)
 *         details:
 *           type: string
 *           description: Additional details about the action
 *         user_agent:
 *           type: string
 *           description: User-Agent string from the request
 */

/**
 * @swagger
 * /activity-logs:
 *   get:
 *     summary: Get all activity logs with filtering, sorting, and pagination
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by User ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type (e.g., 'login', 'create', 'update')
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g., 'User', 'Course', 'Week')
 *       - in: query
 *         name: entity_id
 *         schema:
 *           type: string
 *         description: Filter by Entity ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs from this date onwards (ISO 8601)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs up to this date (ISO 8601)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort order (e.g., '-timestamp' for newest first)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of logs per page
 *     responses:
 *       200:
 *         description: List of activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityLog'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (only admins should access this)
 *       500:
 *         description: Server error
 */
exports.getActivityLogs = async (req, res, next) => {
  try {
    const query = {};
    const { user, action, entity_type, entity_id, start_date, end_date, sort, page = 1, limit = 10 } = req.query;

    if (user) query.user = user;
    if (action) query.action = action;
    if (entity_type) query.entity_type = entity_type;
    if (entity_id) query.entity_id = entity_id;

    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = parseInt(page) * parseInt(limit);
    const total = await ActivityLog.countDocuments(query);

    const activityLogs = await ActivityLog.find(query)
      .populate('user', 'name email') // Populate user details
      .populate({
        path: 'entity_id', // Populate the specific entity based on entity_type
        select: 'title name email' // Select relevant fields for different entities
      })
      .sort(sort || '-timestamp') // Default sort by newest first
      .skip(startIndex)
      .limit(parseInt(limit));

    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: parseInt(page) + 1,
        limit: parseInt(limit)
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: parseInt(page) - 1,
        limit: parseInt(limit)
      };
    }
    pagination.total = total;
    pagination.pages = Math.ceil(total / parseInt(limit));
    pagination.page = parseInt(page);
    pagination.limit = parseInt(limit);


    res.status(200).json({
      success: true,
      count: activityLogs.length,
      pagination,
      data: activityLogs
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /activity-logs/{id}:
 *   get:
 *     summary: Get a single activity log by ID
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity Log ID
 *     responses:
 *       200:
 *         description: Single activity log details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/ActivityLog'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (only admins should access this)
 *       404:
 *         description: Activity Log not found
 *       500:
 *         description: Server error
 */
exports.getActivityLog = async (req, res, next) => {
  try {
    const activityLog = await ActivityLog.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'entity_id',
        select: 'title name email'
      });

    if (!activityLog) {
      return res.status(404).json({ success: false, error: 'Activity Log not found' });
    }

    res.status(200).json({ success: true, data: activityLog });
  } catch (error) {
    console.error('Get single activity log error:', error);
    next(error);
  }
};
