const mongoose = require('mongoose');

const GroupSessionSchema = new mongoose.Schema({
  week: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Week',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true
  },
  description: {
    type: String
  },
  session_date: {
    type: Date,
    required: [true, 'Session date is required']
  },
  start_time: {
    type: String,
    required: [true, 'Start time is required']
  },
  end_time: {
    type: String,
    required: [true, 'End time is required']
  },
  meeting_link: {
    type: String,
    required: [true, 'Meeting link is required']
  },
  recording_url: {
    type: String
  },
  session_type: {
    type: String,
    enum: ['GS-1', 'GS-2'],
    default: 'GS-1'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('GroupSession', GroupSessionSchema);