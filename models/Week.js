const mongoose = require('mongoose');

const WeekSchema = new mongoose.Schema({
  phase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phase',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Week title is required'],
    trim: true
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
  icon_url: {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Week', WeekSchema);