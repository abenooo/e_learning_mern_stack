const Week = require('../models/Week');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * /weeks:
 *   get:
 *     summary: Get all weeks with filtering and pagination
 *     tags: [Weeks]
 *     parameters:
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *         description: Filter by phase ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 */
exports.getWeeks = async (req, res, next) => {
  try {
    console.log('Get all weeks request received');
    console.log('Query params:', req.query);
    
    const query = {};
    
    if (req.query.phase) {
      query.phase = req.query.phase;
    }
    
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    console.log('MongoDB query:', query);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const sortField = req.query.sort || 'order_number';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    
    const weeks = await Week.find(query)
      .populate('phase', 'title')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    console.log(`Found ${weeks.length} weeks`);
    
    const total = await Week.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: weeks.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: weeks
    });
  } catch (error) {
    console.error('Error in getWeeks:', error);
    next(error);
  }
};

exports.getWeek = async (req, res, next) => {
  try {
    const week = await Week.findById(req.params.id)
      .populate('phase', 'title');
    
    if (!week) {
      return res.status(404).json({
        success: false,
        error: 'Week not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: week
    });
  } catch (error) {
    next(error);
  }
};

exports.createWeek = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const week = await Week.create(req.body);
    const populatedWeek = await Week.findById(week._id)
      .populate('phase', 'title');
    
    res.status(201).json({
      success: true,
      data: populatedWeek
    });
  } catch (error) {
    next(error);
  }
};

exports.updateWeek = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let week = await Week.findById(req.params.id);
    
    if (!week) {
      return res.status(404).json({
        success: false,
        error: 'Week not found'
      });
    }
    
    week = await Week.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('phase', 'title');
    
    res.status(200).json({
      success: true,
      data: week
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteWeek = async (req, res, next) => {
  try {
    const week = await Week.findById(req.params.id);
    
    if (!week) {
      return res.status(404).json({
        success: false,
        error: 'Week not found'
      });
    }
    
    await Week.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 