const mongoose = require('mongoose');

const PhaseSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  phase_name: {
    type: String,
    required: [true, 'Phase name is required'],
    trim: true
  },
  phase_description: {
    type: String
  },
  phase_order: {
    type: Number,
    required: [true, 'Phase order is required']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  start_date: Date,
  end_date: Date,
  is_active: { type: Boolean, default: true },
  is_required: { type: Boolean, default: true },
  // New fields for frontend-friendly response
  icon: { type: String }, // URL or path to icon
  path: { type: String }, // URL path for the phase
  brief_description: { type: String },
  full_description: { type: String },
  hash: { type: String }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Phase', PhaseSchema);