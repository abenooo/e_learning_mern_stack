const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Video URL is required']
  },
  duration_minutes: {
    type: Number,
    required: [true, 'Video duration is required']
  },
  is_live: {
    type: Boolean,
    default: false
  },
  min_watched_time: {
    type: Number,
    default: 0
  },
  is_disabled: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Video', VideoSchema); 