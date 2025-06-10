const ClassComponent = require('../models/ClassComponent');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * /class-components:
 *   get:
 *     summary: Get all class components with filtering and pagination
 *     tags: [ClassComponents]
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: component_type
 *         schema:
 *           type: string
 *           enum: [video, document, quiz, assignment]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 */
exports.getClassComponents = async (req, res, next) => {
  try {
    console.log('Get all class components request received');
    
    const query = {};
    
    if (req.query.class) {
      query.class = req.query.class;
    }
    
    if (req.query.component_type) {
      query.component_type = req.query.component_type;
    }
    
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const sortField = req.query.sort || 'order_number';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    
    const components = await ClassComponent.find(query)
      .populate('class', 'title')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    const total = await ClassComponent.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: components.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: components
    });
  } catch (error) {
    console.error('Get class components error:', error);
    next(error);
  }
};

exports.getClassComponent = async (req, res, next) => {
  try {
    const component = await ClassComponent.findById(req.params.id)
      .populate('class', 'title');
    
    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Class component not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: component
    });
  } catch (error) {
    next(error);
  }
};

exports.createClassComponent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const component = await ClassComponent.create(req.body);
    const populatedComponent = await ClassComponent.findById(component._id)
      .populate('class', 'title');
    
    res.status(201).json({
      success: true,
      data: populatedComponent
    });
  } catch (error) {
    next(error);
  }
};

exports.updateClassComponent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let component = await ClassComponent.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Class component not found'
      });
    }
    
    component = await ClassComponent.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('class', 'title');
    
    res.status(200).json({
      success: true,
      data: component
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteClassComponent = async (req, res, next) => {
  try {
    const component = await ClassComponent.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Class component not found'
      });
    }
    
    await ClassComponent.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 