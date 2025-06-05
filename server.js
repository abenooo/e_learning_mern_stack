const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { swaggerDocs } = require('./swagger'); 

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const batchRoutes = require('./routes/batches');
const phaseRoutes = require('./routes/phases');

// Initialize Express app
const app = express();

// Configure CORS properly
const corsOptions = {
  origin: '*', // For development only, restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug route to test basic connectivity
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});
// Temporary endpoint to fix the student role issue
app.get('/api/fix-roles', async (req, res) => {
  try {
    const Role = require('./models/Role');
    
    // First, let's check if we have duplicate student roles
    const studentRoles = await Role.find({ name: 'student' });
    console.log('Found student roles:', studentRoles);
    
    if (studentRoles.length > 1) {
      // We have duplicates, let's remove the ones that don't match our schema
      for (const role of studentRoles) {
        // Keep only the one that has all required fields
        if (!role.is_system_role || !role.permission_level) {
          console.log('Removing incomplete student role:', role._id);
          await Role.findByIdAndDelete(role._id);
        }
      }
      
      // Check if we still have a valid student role
      const remainingRole = await Role.findOne({ name: 'student' });
      
      if (!remainingRole) {
        // If we deleted all roles, create a new valid one
        const newRole = await Role.create({
          name: 'student',
          description: 'Student enrolled in courses',
          is_system_role: true,
          permission_level: 10
        });
        console.log('Created new student role:', newRole);
      }
    } else if (studentRoles.length === 0) {
      // No student role exists, create one
      const newRole = await Role.create({
        name: 'student',
        description: 'Student enrolled in courses',
        is_system_role: true,
        permission_level: 10
      });
      console.log('Created new student role:', newRole);
    }
    
    // Get all roles after fixing
    const allRoles = await Role.find();
    
    res.json({
      success: true,
      message: 'Roles fixed successfully',
      roles: allRoles
    });
  } catch (error) {
    console.error('Error fixing roles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Debug route to check roles
app.get('/api/debug/roles', async (req, res) => {
  try {
    const Role = require('./models/Role');
    const roles = await Role.find();
    res.json({ 
      success: true, 
      count: roles.length, 
      data: roles 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Routes - Make sure auth routes are registered before any middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/phases', phaseRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to E-Learning Platform API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Setup Swagger docs
    swaggerDocs(app);
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });