const mongoose = require('mongoose');

const WeekSchema = new mongoose.Schema({
  phase_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phase',
    required: true
  },
  week_name: {
    type: String,
    required: [true, 'Week Name is required'],
    trim: true
  },
  week_description: {
    type: String
  },
  week_order: {
    type: Number,
    required: [true, 'Week order is required']
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_required: {
    type: Boolean,
    default: true
  },
  group_session: {
    title: String,
    description: String,
    duration: Number,
    start_time: Date,
    end_time: Date
  },
  live_session: {
    title: String,
    description: String,
    duration: Number,
    start_time: Date,
    end_time: Date
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Week', WeekSchema);