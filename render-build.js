const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom build script for Render deployment');

// Check if node_modules exists and its state
try {
  if (fs.existsSync('node_modules')) {
    console.log('node_modules directory exists, checking its contents');
    const expressPath = path.join('node_modules', 'express');
    
    if (fs.existsSync(expressPath)) {
      console.log('Express module found, checking its files');
      const routerPath = path.join(expressPath, 'lib', 'router');
      
      if (fs.existsSync(routerPath + '.js')) {
        console.log('Express router.js file exists');
      } else {
        console.log('Express router.js file is missing, will reinstall');
        throw new Error('Express installation is incomplete');
      }
    } else {
      console.log('Express module not found, will reinstall');
      throw new Error('Express module missing');
    }
  } else {
    console.log('node_modules directory does not exist, will install dependencies');
  }
} catch (error) {
  console.log('Error checking modules:', error.message);
  console.log('Cleaning node_modules and reinstalling');
  
  try {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
    console.log('Removed node_modules directory');
  } catch (e) {
    console.log('Error removing node_modules:', e.message);
  }
}

// Install dependencies
console.log('Installing dependencies with npm ci');
try {
  execSync('npm ci', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');
} catch (error) {
  console.log('Error with npm ci, falling back to npm install');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Dependencies installed successfully with npm install');
  } catch (e) {
    console.error('Failed to install dependencies:', e.message);
    process.exit(1);
  }
}

// Verify express installation
try {
  const expressPath = path.join('node_modules', 'express');
  const routerPath = path.join(expressPath, 'lib', 'router.js');
  
  if (fs.existsSync(routerPath)) {
    console.log('Express router.js file exists after installation');
  } else {
    console.error('Express router.js file is still missing after installation!');
    console.log('Contents of express/lib directory:');
    try {
      const libContents = fs.readdirSync(path.join(expressPath, 'lib'));
      console.log(libContents);
    } catch (e) {
      console.log('Could not read express/lib directory:', e.message);
    }
    process.exit(1);
  }
} catch (error) {
  console.error('Error verifying express installation:', error.message);
  process.exit(1);
}

console.log('Build script completed successfully');