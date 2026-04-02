/**
 * Core HTTP server for markdown-novel-viewer
 * Handles routing for markdown viewer and directory browser
 *
 * Routes:
 * - /view?file=<path>  - Markdown file viewer
 * - /browse?dir=<path> - Directory browser
 * - /assets/*          - Static assets
 * - /file/*            - Local files (images, etc.)
 *
 * Security: Paths are validated to prevent directory traversal attacks
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Allowed base directories for file access (set at runtime)
let allowedBaseDirs = [];

/**
 * Set allowed directories for file serving
 * @param {string[]} dirs - Array of allowed directory paths
 */
function setAllowedDirs(dirs) {
  allowedBaseDirs = dirs.map(d => path.resolve(d));
}

/**
 * Validate path is within allowed directories (prevents path traversal)
 * @param {string} filePath - Path to validate
 * @param {string[]} allowedDirs - Allowed base directories
 * @returns {boolean} - True if path is safe
 */
function isPathSafe(filePath, allowedDirs = allowedBaseDirs) {
  const resolved = path.resolve(filePath);

  // Check for path traversal attempts
  if (resolved.includes('..') || filePath.includes('\0')) {
    return false;
  }

  // If no allowed dirs set, allow only project paths
  if (allowedDirs.length === 0) {
    return true;
  }

  // Must be within one of the allowed directories
  return allowedDirs.some(dir => resolved.startsWith(dir));
}

/**
 * Sanitize error message to prevent path disclosure
 */
function sanitizeErrorMessage(message) {
  return message.replace(/\/[^\s'"<>]+/g, '[path]');
}

// MIME type mapping
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf'
};

/**
 * Get MIME type for file extension
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Send response with content
 */
function sendResponse(res, statusCode, contentType, content) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
}

/**
 * Send error response (sanitized)
 */
function sendError(res, statusCode, message) {
  const safeMessage = sanitizeErrorMessage(message);
  sendResponse(res, statusCode, 'text/html', `
    <!DOCTYPE html>
    <html>
    <head><title>Error ${statusCode}</title></head>
    <body style="font-family: system-ui; padding: 2rem;">
      <h1>Error ${statusCode}</h1>
      <p>${safeMessage}</p>
    </body>
    </html>
  `);
}

/**
 * Serve static file with path validation
 */
function serveFile(res, filePath, skipValidation = false) {
  if (!skipValidation && !isPathSafe(filePath)) {
    sendError(res, 403, 'Access denied');
    return;
  }

  if (!fs.existsSync(filePath)) {
    sendError(res, 404, 'File not found');
    return;
  }

  const content = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);
  sendResponse(res, 200, mimeType, content);
}

/**
 * Get file icon based on extension
 */
function getFileIcon(filename) {
  const ext = path.extname(filename).toLowerCase();
  const iconMap = {
    '.md': '📄',
    '.txt': '📝',
    '.json': '📋',
    '.js': '📜',
    '.cjs': '📜',
    '.mjs': '📜',
    '.ts': '📘',
    '.css': '🎨',
    '.html': '🌐',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.gif': '🖼️',
    '.svg': '🖼️',
    '.pdf': '📕',
    '.yaml': '⚙️',
    '.yml': '⚙️',
    '.toml': '⚙️',
    '.env': '🔐',
    '.sh': '💻',
    '.bash': '💻'
  };
  return iconMap[ext] || '📄';
}

/**
 * Render directory browser HTML
 */
function renderDirectoryBrowser(dirPath, assetsDir) {
  const items = fs.readdirSync(dirPath);
  const displayPath = dirPath.length > 50 ? '...' + dirPath.slice(-47) : dirPath;

  // Separate directories and files, sort alphabetically
  const dirs = [];
  const files = [];

  for (const item of items) {
    // Skip hidden files and deprecated folders
    if (item.startsWith('.') || item === 'deprecated') continue;

    const itemPath = path.join(dirPath, item);
    try {
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        dirs.push(item);
      } else {
        files.push(item);
      }
    } catch {
      // Skip items we can't stat
    }
  }

  dirs.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // Build file list HTML
  let listHtml = '';

  // Parent directory link (if not root)
  const parentDir = path.dirname(dirPath);
  if (parentDir !== dirPath) {
    listHtml += `<li class="dir-item parent">
      <a href="/browse?dir=${encodeURIComponent(parentDir)}">
        <span class="icon">📁</span>
        <span class="name">..</span>
      </a>
    </li>`;
  }

  // Directories
  for (const dir of dirs) {
    const fullPath = path.join(dirPath, dir);
    listHtml += `<li class="dir-item folder">
      <a href="/browse?dir=${encodeURIComponent(fullPath)}">
        <span class="icon">📁</span>
        <span class="name">${dir}/</span>
      </a>
    </li>`;
  }

  // Files
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const icon = getFileIcon(file);
    const isMarkdown = file.endsWith('.md');

    if (isMarkdown) {
      listHtml += `<li class="dir-item file markdown">
        <a href="/view?file=${encodeURIComponent(fullPath)}">
          <span class="icon">${icon}</span>
          <span class="name">${file}</span>
        </a>
      </li>`;
    } else {
      listHtml += `<li class="dir-item file">
        <a href="/file${fullPath}" target="_blank">
          <span class="icon">${icon}</span>
          <span class="name">${file}</span>
        </a>
      </li>`;
    }
  }

  // Empty directory message
  if (dirs.length === 0 && files.length === 0) {
    listHtml = '<li class="empty">This directory is empty</li>';
  }

  // Read CSS
  let css = '';
  const cssPath = path.join(assetsDir, 'directory-browser.css');
  if (fs.existsSync(cssPath)) {
    css = fs.readFileSync(cssPath, 'utf8');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📁 ${path.basename(dirPath)}</title>
  <style>
    ${css}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📁 ${path.basename(dirPath)}</h1>
      <p class="path">${displayPath}</p>
    </header>
    <ul class="file-list">
      ${listHtml}
    </ul>
    <footer>
      <p>${dirs.length} folder${dirs.length !== 1 ? 's' : ''}, ${files.length} file${files.length !== 1 ? 's' : ''}</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Create HTTP server with routing
 * @param {Object} options - Server options
 * @param {string} options.assetsDir - Static assets directory
 * @param {Function} options.renderMarkdown - Markdown render function (filePath) => html
 * @param {string[]} options.allowedDirs - Allowed directories for file access
 * @returns {http.Server} - HTTP server instance
 */
function createHttpServer(options) {
  const { assetsDir, renderMarkdown, allowedDirs = [] } = options;

  // Set allowed directories for path validation
  if (allowedDirs.length > 0) {
    setAllowedDirs(allowedDirs);
  }

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Route: /assets/* - serve static files from assets directory
    if (pathname.startsWith('/assets/')) {
      const relativePath = pathname.replace('/assets/', '');
      if (relativePath.includes('..')) {
        sendError(res, 403, 'Access denied');
        return;
      }
      const assetPath = path.join(assetsDir, relativePath);
      serveFile(res, assetPath, true);
      return;
    }

    // Route: /file/* - serve local files (images, etc.)
    if (pathname.startsWith('/file/')) {
      // Extract path after '/file/' prefix (slice(6) removes '/file/')
      // Path is already URL-decoded by decodeURIComponent above
      const filePath = pathname.slice(6);

      if (!isPathSafe(filePath)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      serveFile(res, filePath);
      return;
    }

    // Route: /view?file=<path> - render markdown (query param)
    if (pathname === '/view') {
      const filePath = parsedUrl.query?.file;

      if (!filePath) {
        sendError(res, 400, 'Missing ?file= parameter. Use /view?file=/path/to/file.md');
        return;
      }

      if (!isPathSafe(filePath)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      if (!fs.existsSync(filePath)) {
        sendError(res, 404, 'File not found');
        return;
      }

      try {
        const html = renderMarkdown(filePath);
        sendResponse(res, 200, 'text/html', html);
      } catch (err) {
        console.error('[http-server] Render error:', err.message);
        sendError(res, 500, 'Error rendering markdown');
      }
      return;
    }

    // Route: /browse?dir=<path> - directory browser (query param)
    if (pathname === '/browse') {
      const dirPath = parsedUrl.query?.dir;

      if (!dirPath) {
        sendError(res, 400, 'Missing ?dir= parameter. Use /browse?dir=/path/to/directory');
        return;
      }

      if (!isPathSafe(dirPath)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        sendError(res, 404, 'Directory not found');
        return;
      }

      try {
        const html = renderDirectoryBrowser(dirPath, assetsDir);
        sendResponse(res, 200, 'text/html', html);
      } catch (err) {
        console.error('[http-server] Browse error:', err.message);
        sendError(res, 500, 'Error listing directory');
      }
      return;
    }

    // Route: / - show welcome/usage page
    if (pathname === '/') {
      sendResponse(res, 200, 'text/html', `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Markdown Novel Viewer</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; }
            h1 { color: #8b4513; }
            code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
            .routes { background: #faf8f3; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <h1>📖 Markdown Novel Viewer</h1>
          <p>A calm, book-like viewer for markdown files.</p>
          <div class="routes">
            <h3>Routes</h3>
            <ul>
              <li><code>/view?file=/path/to/file.md</code> - View markdown</li>
              <li><code>/browse?dir=/path/to/dir</code> - Browse directory</li>
            </ul>
          </div>
          <p>Use the <code>/ck:preview</code> skill invocation to start viewing files.</p>
        </body>
        </html>
      `);
      return;
    }

    // Default: 404
    sendError(res, 404, 'Not found');
  });

  return server;
}

module.exports = {
  createHttpServer,
  getMimeType,
  sendResponse,
  sendError,
  serveFile,
  isPathSafe,
  setAllowedDirs,
  sanitizeErrorMessage,
  MIME_TYPES,
  renderDirectoryBrowser,
  getFileIcon
};
