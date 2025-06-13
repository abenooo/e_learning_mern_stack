require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

mongoose.set('strictQuery', false);

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB connected');
    
    // Find all courses
    const courses = await Course.find({});
    console.log('Available courses:');
    courses.forEach(course => {
      console.log(`ID: ${course._id}, Title: ${course.title}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 