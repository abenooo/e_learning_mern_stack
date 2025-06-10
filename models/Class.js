const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  week: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Week',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Class title is required'],
    trim: true
  },
  description: {
    type: String
  },
  order_number: {
    type: Number,
    required: [true, 'Order number is required']
  },
  type: {
    type: String,
    enum: ['lecture', 'workshop', 'assessment'],
    default: 'lecture'
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

module.exports = mongoose.model('Class', ClassSchema); 