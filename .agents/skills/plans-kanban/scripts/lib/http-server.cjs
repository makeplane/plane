/**
 * HTTP server for plans-kanban dashboard
 * Routes: /kanban, /api/plans, /assets/*, /file/*
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { scanPlans } = require('./plan-scanner.cjs');
const { renderDashboard } = require('./dashboard-renderer.cjs');

// Import full page renderer from markdown-novel-viewer skill
let generateFullPage = null;
let mdViewerAssetsDir = null;
try {
  const mdViewerDir = path.join(__dirname, '..', '..', '..', 'markdown-novel-viewer');
  mdViewerAssetsDir = path.join(mdViewerDir, 'assets');
  // We need to call the server's generateFullPage function
  // Since it's not exported, we'll create a minimal wrapper
  const { renderMarkdownFile, renderTOCHtml } = require(path.join(mdViewerDir, 'scripts', 'lib', 'markdown-renderer.cjs'));
  const { generateNavSidebar, generateNavFooter, detectPlan } = require(path.join(mdViewerDir, 'scripts', 'lib', 'plan-navigator.cjs'));

  generateFullPage = (filePath, options = {}) => {
    const { html, toc, frontmatter, title } = renderMarkdownFile(filePath);
    const tocHtml = renderTOCHtml(toc);
    const navSidebar = generateNavSidebar(filePath);
    const navFooter = generateNavFooter(filePath);
    const planInfo = detectPlan(filePath);
    const { getNavigationContext } = require(path.join(mdViewerDir, 'scripts', 'lib', 'plan-navigator.cjs'));
    const navContext = getNavigationContext(filePath);

    const templatePath = path.join(mdViewerAssetsDir, 'template.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Generate back button for kanban
    const backUrl = options.dashboardUrl || '/kanban';
    const backButton = `
      <a href="${backUrl}" class="icon-btn back-btn" title="Back to Dashboard">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </a>`;

    // Generate header nav (prev/next)
    let headerNav = '';
    if (navContext.prev || navContext.next) {
      const prevBtn = navContext.prev && fs.existsSync(navContext.prev.file)
        ? `<a href="/view?file=${encodeURIComponent(navContext.prev.file)}" class="header-nav-btn prev" title="${navContext.prev.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            <span>Prev</span>
          </a>`
        : '';
      const nextBtn = navContext.next && fs.existsSync(navContext.next.file)
        ? `<a href="/view?file=${encodeURIComponent(navContext.next.file)}" class="header-nav-btn next" title="${navContext.next.name}">
            <span>Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </a>`
        : '';
      headerNav = `<div class="header-nav">${prevBtn}${nextBtn}</div>`;
    }

    template = template
      .replace(/\{\{title\}\}/g, title)
      .replace('{{toc}}', tocHtml)
      .replace('{{nav-sidebar}}', navSidebar)
      .replace('{{nav-footer}}', navFooter)
      .replace('{{content}}', html)
      .replace('{{has-plan}}', planInfo.isPlan ? 'has-plan' : '')
      .replace('{{frontmatter}}', JSON.stringify(frontmatter || {}))
      .replace('{{back-button}}', backButton)
      .replace('{{header-nav}}', headerNav);

    return template;
  };
} catch (err) {
  console.warn('[http-server] Could not load markdown renderer:', err.message);
}

// Allowed base directories for file access
let allowedBaseDirs = [];

/**
 * Set allowed directories for file serving
 * @param {string[]} dirs - Array of allowed directory paths
 */
function setAllowedDirs(dirs) {
  allowedBaseDirs = dirs.map(d => path.resolve(d));
}

/**
 * Validate path is within allowed directories
 * @param {string} filePath - Path to validate
 * @returns {boolean} - True if path is safe
 */
function isPathSafe(filePath) {
  const resolved = path.resolve(filePath);
  if (resolved.includes('..') || filePath.includes('\0')) {
    return false;
  }
  if (allowedBaseDirs.length === 0) {
    return true;
  }
  return allowedBaseDirs.some(dir => resolved.startsWith(dir));
}

// MIME types
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
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function sendResponse(res, statusCode, contentType, content) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
}

function sendError(res, statusCode, message) {
  sendResponse(res, statusCode, 'text/html', `
    <!DOCTYPE html>
    <html>
    <head><title>Error ${statusCode}</title></head>
    <body style="font-family: system-ui; padding: 2rem;">
      <h1>Error ${statusCode}</h1>
      <p>${message}</p>
    </body>
    </html>
  `);
}

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
  sendResponse(res, 200, getMimeType(filePath), content);
}

/**
 * Create HTTP server for kanban dashboard
 * @param {Object} options - Server options
 * @param {string} options.assetsDir - Static assets directory
 * @param {string[]} options.allowedDirs - Allowed directories for file access
 * @param {string} options.plansDir - Plans directory for dashboard
 * @returns {http.Server}
 */
function createHttpServer(options) {
  const { assetsDir, allowedDirs = [], plansDir } = options;

  if (allowedDirs.length > 0) {
    setAllowedDirs(allowedDirs);
  }

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Route: /assets/* - serve static files (check kanban assets first, then markdown-viewer assets)
    if (pathname.startsWith('/assets/')) {
      const relativePath = pathname.replace('/assets/', '');
      if (relativePath.includes('..')) {
        sendError(res, 403, 'Access denied');
        return;
      }
      // Check kanban assets first
      let assetPath = path.join(assetsDir, relativePath);
      if (!fs.existsSync(assetPath) && mdViewerAssetsDir) {
        // Fallback to markdown-novel-viewer assets
        assetPath = path.join(mdViewerAssetsDir, relativePath);
      }
      serveFile(res, assetPath, true);
      return;
    }

    // Route: /file/* - serve local files (images, etc.)
    if (pathname.startsWith('/file/')) {
      const filePath = pathname.replace('/file', '');
      if (!isPathSafe(filePath)) {
        sendError(res, 403, 'Access denied');
        return;
      }
      serveFile(res, filePath);
      return;
    }

    // Route: /api/plans - JSON API for plans data
    if (pathname === '/api/plans') {
      const customDir = parsedUrl.query?.dir;
      const dir = customDir || plansDir;

      if (customDir && !isPathSafe(customDir)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      if (!dir) {
        sendResponse(res, 200, 'application/json', JSON.stringify({ plans: [], error: 'Plans directory not configured' }));
        return;
      }

      try {
        const plans = scanPlans(dir);
        sendResponse(res, 200, 'application/json', JSON.stringify({ plans }));
      } catch (err) {
        console.error('[http-server] API error:', err.message);
        sendResponse(res, 500, 'application/json', JSON.stringify({ error: 'Error scanning plans' }));
      }
      return;
    }

    // Route: / or /kanban - render dashboard
    if (pathname === '/' || pathname === '/kanban') {
      const customDir = parsedUrl.query?.dir;
      const dir = customDir || plansDir;

      if (customDir && !isPathSafe(customDir)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      if (!dir) {
        sendError(res, 400, 'Plans directory not configured');
        return;
      }

      try {
        const plans = scanPlans(dir);
        const html = renderDashboard(plans, { assetsDir, plansDir: dir });
        sendResponse(res, 200, 'text/html', html);
      } catch (err) {
        console.error('[http-server] Dashboard error:', err.message);
        sendError(res, 500, 'Error rendering dashboard');
      }
      return;
    }

    // Route: /view?file=<path> - render markdown file
    if (pathname === '/view') {
      const filePath = parsedUrl.query?.file;

      if (!filePath) {
        sendError(res, 400, 'Missing ?file= parameter');
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

      if (!generateFullPage) {
        sendError(res, 500, 'Markdown renderer not available');
        return;
      }

      try {
        // Build dashboard URL with the plans directory
        const dashboardUrl = `/kanban?dir=${encodeURIComponent(plansDir)}`;
        const html = generateFullPage(filePath, { dashboardUrl });
        sendResponse(res, 200, 'text/html', html);
      } catch (err) {
        console.error('[http-server] Render error:', err.message);
        sendError(res, 500, 'Error rendering markdown');
      }
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
  MIME_TYPES
};
