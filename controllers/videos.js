const Video = require('../models/Video');
const { validationResult } = require('express-validator');

exports.getVideos = async (req, res, next) => {
  try {
    const query = {};
    
    if (req.query.class) {
      query.class = req.query.class;
    }
    
    if (req.query.is_live !== undefined) {
      query.is_live = req.query.is_live === 'true';
    }
    
    if (req.query.is_disabled !== undefined) {
      query.is_disabled = req.query.is_disabled === 'true';
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const videos = await Video.find(query)
      .populate('class', 'title')
      .sort({ created_at: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Video.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: videos.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: videos
    });
  } catch (error) {
    next(error);
  }
};

exports.getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('class', 'title');
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
};

exports.createVideo = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const video = await Video.create(req.body);
    const populatedVideo = await Video.findById(video._id)
      .populate('class', 'title');
    
    res.status(201).json({
      success: true,
      data: populatedVideo
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVideo = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    video = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('class', 'title');
    
    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    await Video.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 