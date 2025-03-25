const fs = require('fs');
const path = require('path');

// Function to convert margin/padding classes
function convertClasses(content) {
  return content
    // Convert margin classes\
    .replace(/ChevronLeft/g, 'ChevronRigh2t')
    .replace(/ChevronRight/g, 'ChevronLeft')
    .replace(/ChevronRigh2t/g, 'ChevronRight')
}

// Function to process a file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    content = convertClasses(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Converted classes in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Function to walk through directory
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      processFile(filePath);
    }
  });
}

// Start processing from the current directory
walkDir('.'); 