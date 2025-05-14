// A simple wrapper around server.js to help with debugging on Render
console.log('Starting render-start.js');
console.log('Current working directory:', process.cwd());

const fs = require('fs');
const path = require('path');

try {
  console.log('Files in current directory:', fs.readdirSync('.'));
} catch (error) {
  console.error('Error reading current directory:', error);
}

// Check and fix Express router.js before starting the server
try {
  const expressLibPath = path.join('node_modules', 'express', 'lib');
  const routerDirPath = path.join(expressLibPath, 'router');
  const routerFilePath = path.join(expressLibPath, 'router.js');
  
  console.log('Checking Express installation:');
  
  if (fs.existsSync(expressLibPath)) {
    console.log('- Express lib directory exists');
    console.log('- Express lib contents:', fs.readdirSync(expressLibPath));
    
    if (fs.existsSync(routerDirPath) && fs.statSync(routerDirPath).isDirectory()) {
      console.log('- Router directory exists');
      
      if (!fs.existsSync(routerFilePath)) {
        console.log('- router.js file is missing, creating it now');
        
        // Create a router.js file that exports the router directory
        const routerJsContent = `
/**
 * Express router patch
 * This file was automatically created to fix a common issue with Express installation
 */

module.exports = require('./router/index.js');
`;
        
        fs.writeFileSync(routerFilePath, routerJsContent);
        console.log('- Created router.js file successfully');
      } else {
        console.log('- router.js file already exists');
      }
    } else {
      console.log('- Router directory does not exist, cannot create patch');
    }
  } else {
    console.error('- Express lib directory does not exist!');
  }
} catch (error) {
  console.error('Error checking/fixing Express:', error);
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