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
      const routerJsPath = path.join(expressPath, 'lib', 'router.js');
      
      if (fs.existsSync(routerJsPath)) {
        console.log('Express router.js file exists');
      } else if (fs.existsSync(routerPath) && fs.statSync(routerPath).isDirectory()) {
        console.log('Express router directory exists but router.js is missing');
        console.log('Will reinstall and patch Express');
        throw new Error('Express installation is incomplete');
      } else {
        console.log('Express router directory is missing, will reinstall');
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

// Run the Express patch script
console.log('Running Express patch script');
try {
  require('./express-patch');
} catch (error) {
  console.error('Error running Express patch:', error.message);
}

// Verify express installation
try {
  const expressPath = path.join('node_modules', 'express');
  const routerJsPath = path.join(expressPath, 'lib', 'router.js');
  const routerDirPath = path.join(expressPath, 'lib', 'router');
  
  console.log('Checking Express installation:');
  console.log('- Express lib directory exists:', fs.existsSync(path.join(expressPath, 'lib')));
  
  if (fs.existsSync(routerDirPath)) {
    console.log('- Router directory exists');
    console.log('- Router directory contents:', fs.readdirSync(routerDirPath));
  } else {
    console.log('- Router directory does not exist');
  }
  
  if (fs.existsSync(routerJsPath)) {
    console.log('- router.js file exists');
    console.log('- router.js content:', fs.readFileSync(routerJsPath, 'utf8'));
  } else {
    console.error('- router.js file is missing!');
  }
  
  console.log('- Express lib directory contents:', fs.readdirSync(path.join(expressPath, 'lib')));
  
  if (!fs.existsSync(routerJsPath)) {
    throw new Error('Express router.js file is still missing after patching');
  }
} catch (error) {
  console.error('Error verifying express installation:', error.message);
  process.exit(1);
}

console.log('Build script completed successfully');