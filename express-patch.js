const fs = require('fs');
const path = require('path');

console.log('Running Express patch script');

// Check if router directory exists but router.js doesn't
const expressPath = path.join('node_modules', 'express', 'lib');
const routerDirPath = path.join(expressPath, 'router');
const routerFilePath = path.join(expressPath, 'router.js');

try {
  // Check if router directory exists
  if (fs.existsSync(routerDirPath) && fs.statSync(routerDirPath).isDirectory()) {
    console.log('Router directory exists');
    
    // Check if router.js doesn't exist
    if (!fs.existsSync(routerFilePath)) {
      console.log('router.js file is missing, creating it');
      
      // Create a router.js file that exports the router directory
      const routerJsContent = `
/**
 * Express router patch
 * This file was automatically created to fix a common issue with Express installation
 */

module.exports = require('./router/index.js');
`;
      
      fs.writeFileSync(routerFilePath, routerJsContent);
      console.log('Created router.js file successfully');
    } else {
      console.log('router.js file already exists');
    }
  } else {
    console.log('Router directory does not exist, cannot create patch');
  }
} catch (error) {
  console.error('Error patching Express:', error);
}