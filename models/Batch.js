const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true
  },
  batch_code: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    trim: true
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required']
  },
  description: {
    type: String
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  max_students: {
    type: Number,
    default: 50
  },
  meeting_link: {
    type: String
  },
  flyer_url: {
    type: String
  },
  schedule_url: {
    type: String
  },
  class_days: {
    type: String,
    default: 'Sat & Sun'
  },
  class_start_time: {
    type: String
  },
  class_end_time: {
    type: String
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Batch', BatchSchema);