const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batch_course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchCourse',
    required: true
  },
  enrollment_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  },
  enrollment_type: {
    type: String,
    enum: ['paid', 'scholarship'],
    default: 'paid'
  },
  payment_amount: {
    type: Number,
    default: 0
  },
  payment_status: {
    type: String,
    default: 'pending'
  },
  completion_date: {
    type: Date
  },
  enrolled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  progress_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Compound index to ensure a user is only enrolled once in a batch course
EnrollmentSchema.index({ user: 1, batch_course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);