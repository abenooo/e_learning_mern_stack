const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/Course');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const courses = await Course.find({}, '_id title');
    
    console.log('\nAvailable Courses:');
    courses.forEach(course => {
      console.log(`Title: ${course.title}`);
      console.log(`Full ID: ${course._id}`);
      console.log(`Hash: ${course._id.toString().slice(-16)}`);
      console.log('---');
    });
    
    await mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
  });