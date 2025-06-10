const ChecklistItem = require('../models/ChecklistItem');
const { validationResult } = require('express-validator');

exports.getChecklistItems = async (req, res, next) => {
  try {
    const query = {};
    
    if (req.query.checklist) {
      query.checklist = req.query.checklist;
    }
    
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const items = await ChecklistItem.find(query)
      .populate('checklist', 'title')
      .sort({ order_number: 1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await ChecklistItem.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: items.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: items
    });
  } catch (error) {
    next(error);
  }
};

exports.getChecklistItem = async (req, res, next) => {
  try {
    const item = await ChecklistItem.findById(req.params.id)
      .populate('checklist', 'title');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.createChecklistItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const item = await ChecklistItem.create(req.body);
    const populatedItem = await ChecklistItem.findById(item._id)
      .populate('checklist', 'title');
    
    res.status(201).json({
      success: true,
      data: populatedItem
    });
  } catch (error) {
    next(error);
  }
};

exports.updateChecklistItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let item = await ChecklistItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }
    
    item = await ChecklistItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('checklist', 'title');
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteChecklistItem = async (req, res, next) => {
  try {
    const item = await ChecklistItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }
    
    await ChecklistItem.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 