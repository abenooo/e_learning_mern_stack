const mongoose = require('mongoose');

const ClassComponentSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Component title is required'],
    trim: true
  },
  content: {
    type: String
  },
  component_type: {
    type: String,
    enum: ['video', 'document', 'quiz', 'assignment'],
    required: true
  },
  icon_type: {
    type: String
  },
  order_number: {
    type: Number,
    required: [true, 'Order number is required']
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

module.exports = mongoose.model('ClassComponent', ClassComponentSchema); 