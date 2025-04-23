import fs from 'fs';
import path from 'path';

console.log('Running build helper script...');

// Helper function to move files
function moveFile(source, destination) {
  try {
    // Check if source exists
    if (!fs.existsSync(source)) {
      console.log(`Source file ${source} does not exist, skipping`);
      return;
    }
    
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(`Created directory ${destDir}`);
    }
    
    // Copy the file
    fs.copyFileSync(source, destination);
    console.log(`Copied ${source} to ${destination}`);
    
    // Remove the source file
    try {
      fs.unlinkSync(source);
      console.log(`Removed original file ${source}`);
    } catch (err) {
      console.log(`Warning: Could not remove ${source}: ${err.message}`);
    }
  } catch (error) {
    console.error(`Error processing file from ${source} to ${destination}:`, error);
    // Don't exit on error, try to continue with the build
  }
}

// Clean up the dist directory structure
function cleanupDist() {
  console.log('Cleaning up dist directory structure...');
  const distDir = path.resolve('dist');
  
  // Check if dist exists
  if (!fs.existsSync(distDir)) {
    console.log('Dist directory does not exist, creating it');
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Check if src/server.js exists in dist
  const srcServerPath = path.join(distDir, 'src', 'server.js');
  const destServerPath = path.join(distDir, 'server.js');
  
  if (fs.existsSync(srcServerPath)) {
    // Move server.js to the root of dist
    moveFile(srcServerPath, destServerPath);
    
    // Remove the src directory if it's empty
    const srcDir = path.join(distDir, 'src');
    if (fs.existsSync(srcDir)) {
      try {
        fs.rmdirSync(srcDir, { recursive: true });
        console.log(`Removed ${srcDir} directory`);
      } catch (error) {
        console.error(`Warning: Could not remove ${srcDir} directory: ${error.message}`);
      }
    }
  } else {
    console.log(`${srcServerPath} does not exist, checking if we need to create server.js`);
    
    // If server.js doesn't exist in dist, copy it from the source
    if (!fs.existsSync(destServerPath) && fs.existsSync('src/server.js')) {
      try {
        fs.copyFileSync('src/server.js', destServerPath);
        console.log(`Copied src/server.js to ${destServerPath}`);
      } catch (error) {
        console.error(`Error copying server.js: ${error.message}`);
      }
    }
  }
  
  console.log('Build helper script completed');
}

// Run the cleanup
cleanupDist();
