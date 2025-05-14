// A simple wrapper around server.js to help with debugging on Render
console.log('Starting render-start.js');
console.log('Current working directory:', process.cwd());

try {
  console.log('Files in current directory:', require('fs').readdirSync('.'));
} catch (error) {
  console.error('Error reading current directory:', error);
}

try {
  console.log('Files in node_modules/express/lib:', require('fs').readdirSync('./node_modules/express/lib'));
} catch (error) {
  console.error('Error reading express lib directory:', error);
}

// Log environment variables (excluding sensitive info)
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MongoDB URI is set:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);
console.log('REFRESH_TOKEN_SECRET is set:', !!process.env.REFRESH_TOKEN_SECRET);

try {
  // Start the main server
  console.log('Attempting to start server.js');
  require('./server');
  console.log('Server started successfully');
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}