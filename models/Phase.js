const mongoose = require('mongoose');

const PhaseSchema = new mongoose.Schema({
  batch_course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchCourse',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Phase title is required'],
    trim: true
  },
  description: {
    type: String
  },
  icon_url: {
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
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Phase', PhaseSchema);