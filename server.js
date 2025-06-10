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
const routes = require('./routes');

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

// Debug routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Routes
app.use('/api/auth', routes.authRoutes);
app.use('/api/users', routes.userRoutes);
app.use('/api/courses', routes.courseRoutes);
app.use('/api/batches', routes.batchRoutes);
app.use('/api/phases', routes.phaseRoutes);
app.use('/api/groups', routes.groupRoutes);
app.use('/api/enrollments', routes.enrollmentRoutes);
app.use('/api/weeks', routes.weekRoutes);
app.use('/api/classes', routes.classRoutes);
app.use('/api/class-components', routes.classComponentRoutes);
app.use('/api/videos', routes.videoRoutes);
app.use('/api/checklists', routes.checklistRoutes);
app.use('/api/checklist-items', routes.checklistItemRoutes);

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