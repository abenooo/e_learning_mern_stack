const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Import models (this ensures they're registered with Mongoose)
require('./models/User');
require('./models/Role');
require('./models/UserRole');
require('./models/Permission');
require('./models/RolePermission');
require('./models/Course');
require('./models/Batch');
require('./models/BatchCourse');
require('./models/Group');
require('./models/Phase');
require('./models/Week');
require('./models/BatchUser');
require('./models/GroupUser');
require('./models/CourseInstructor');
require('./models/BatchInstructor');
require('./models/LiveSession');
require('./models/GroupSession');
require('./models/Attendance');
require('./models/Enrollment');

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to E-Learning Platform API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});