import fs from 'fs';
import path from 'path';

// Helper function to move files
function moveFile(source, destination) {
  try {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(source, destination);
    
    // Remove the source file
    fs.unlinkSync(source);
    
    console.log(`Successfully moved ${source} to ${destination}`);
  } catch (error) {
    console.error(`Error moving file from ${source} to ${destination}:`, error);
    process.exit(1);
  }
}

// Clean up the dist directory structure
function cleanupDist() {
  const distDir = path.resolve('dist');
  
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
        console.error(`Error removing ${srcDir} directory:`, error);
      }
    }
  }
}

// Run the cleanup
cleanupDist();
