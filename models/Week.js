const mongoose = require('mongoose');

const WeekSchema = new mongoose.Schema({
  phase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phase',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Week Name is required'],
    trim: true
  },
  display_title: {
    type: String,
    trim: true,
  },
  description: {
    type: String
  },
  order_number: {
    type: Number,
    required: [true, 'Order number is required']
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupSession',
    required: false
  },
  live_session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession',
    required: false
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Week', WeekSchema);