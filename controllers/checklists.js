const Checklist = require('../models/Checklist');
const { validationResult } = require('express-validator');

exports.getChecklists = async (req, res, next) => {
  try {
    const query = {};
    
    if (req.query.class) {
      query.class = req.query.class;
    }
    
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const checklists = await Checklist.find(query)
      .populate('class', 'title')
      .sort({ created_at: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Checklist.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: checklists.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: checklists
    });
  } catch (error) {
    next(error);
  }
};

exports.getChecklist = async (req, res, next) => {
  try {
    const checklist = await Checklist.findById(req.params.id)
      .populate('class', 'title');
    
    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: 'Checklist not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: checklist
    });
  } catch (error) {
    next(error);
  }
};

exports.createChecklist = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const checklist = await Checklist.create(req.body);
    const populatedChecklist = await Checklist.findById(checklist._id)
      .populate('class', 'title');
    
    res.status(201).json({
      success: true,
      data: populatedChecklist
    });
  } catch (error) {
    next(error);
  }
};

exports.updateChecklist = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let checklist = await Checklist.findById(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: 'Checklist not found'
      });
    }
    
    checklist = await Checklist.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('class', 'title');
    
    res.status(200).json({
      success: true,
      data: checklist
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteChecklist = async (req, res, next) => {
  try {
    const checklist = await Checklist.findById(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: 'Checklist not found'
      });
    }
    
    await Checklist.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 