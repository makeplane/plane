#!/usr/bin/env node

/**
 * Markdown Novel Viewer Server
 * Background HTTP server rendering markdown files with calm, book-like UI
 *
 * Universal viewer - pass ANY path and view it:
 * - Markdown files → novel-reader UI
 * - Directories → file listing browser
 *
 * Usage:
 *   node server.cjs --file ./plan.md [--port 3456] [--no-open] [--stop] [--host 0.0.0.0]
 *   node server.cjs --dir ./plans [--port 3456]  # Browse directory
 *
 * Options:
 *   --file <path>   Path to markdown file
 *   --dir <path>    Path to directory (browse mode)
 *   --port <number> Server port (default: 3456, auto-increment if busy)
 *   --host <addr>   Host to bind (default: localhost, use 0.0.0.0 for all interfaces)
 *   --no-open       Disable auto-open browser (opens by default)
 *   --stop          Stop all running servers
 *   --background    Run in background (detached) - legacy mode
 *   --foreground    Run in foreground (for CC background tasks)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

const { findAvailablePort, DEFAULT_PORT } = require('./lib/port-finder.cjs');
const { writePidFile, stopAllServers, setupShutdownHandlers, findRunningInstances } = require('./lib/process-mgr.cjs');
const { createHttpServer } = require('./lib/http-server.cjs');
const { renderMarkdownFile, renderTOCHtml } = require('./lib/markdown-renderer.cjs');
const { generateNavSidebar, generateNavFooter, detectPlan, getNavigationContext } = require('./lib/plan-navigator.cjs');

/**
 * Parse command line arguments
 */
function parseArgs(argv) {
  const args = {
    file: null,
    dir: null,
    port: DEFAULT_PORT,
    host: 'localhost',
    open: true,  // Auto-open browser by default
    stop: false,
    background: false,
    foreground: false,
    isChild: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--file' && argv[i + 1]) {
      args.file = argv[++i];
    } else if (arg === '--dir' && argv[i + 1]) {
      args.dir = argv[++i];
    } else if (arg === '--port' && argv[i + 1]) {
      args.port = parseInt(argv[++i], 10);
    } else if (arg === '--host' && argv[i + 1]) {
      args.host = argv[++i];
    } else if (arg === '--open') {
      args.open = true;
    } else if (arg === '--no-open') {
      args.open = false;
    } else if (arg === '--stop') {
      args.stop = true;
    } else if (arg === '--background') {
      args.background = true;
    } else if (arg === '--foreground') {
      args.foreground = true;
    } else if (arg === '--child') {
      args.isChild = true;
    } else if (!arg.startsWith('--') && !args.file && !args.dir) {
      // Positional argument - could be file or directory
      args.file = arg;
    }
  }

  return args;
}

/**
 * Resolve input path - simple logic, no smart detection
 * @param {string} input - Input path
 * @param {string} cwd - Current working directory
 * @returns {{type: 'file'|'directory'|null, path: string|null}}
 */
function resolveInput(input, cwd) {
  if (!input) return { type: null, path: null };

  // Resolve relative to CWD
  const resolved = path.isAbsolute(input) ? input : path.resolve(cwd, input);

  if (!fs.existsSync(resolved)) {
    return { type: null, path: null };
  }

  const stats = fs.statSync(resolved);

  // File mode
  if (stats.isFile()) {
    return { type: 'file', path: resolved };
  }

  // Directory mode - browse, no auto-detection of plan.md
  if (stats.isDirectory()) {
    return { type: 'directory', path: resolved };
  }

  return { type: null, path: null };
}

/**
 * Open browser with URL
 */
function openBrowser(url) {
  const platform = process.platform;
  let cmd;

  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    // On Windows, start command treats first quoted arg as window title
    // Use empty title "" before the URL to prevent this
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    // Ignore browser open errors
  }
}

/**
 * Generate full HTML page from markdown
 */
function generateFullPage(filePath, assetsDir) {
  const { html, toc, frontmatter, title } = renderMarkdownFile(filePath);
  const tocHtml = renderTOCHtml(toc);
  const navSidebar = generateNavSidebar(filePath);
  const navFooter = generateNavFooter(filePath);
  const planInfo = detectPlan(filePath);
  const navContext = getNavigationContext(filePath);

  // Read template
  const templatePath = path.join(assetsDir, 'template.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Generate back button (links to parent directory browser)
  const parentDir = path.dirname(filePath);
  const backButton = `
    <a href="/browse?dir=${encodeURIComponent(parentDir)}" class="icon-btn back-btn" title="Back to folder">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </a>`;

  // Generate header nav (prev/next) for plan files
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

  // Replace placeholders
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
}

/**
 * Get local network IP address for remote access
 * @returns {string|null} - Local IP or null if not found
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

/**
 * Build URL with query parameters (fixes path conflicts)
 * @returns {{url: string, networkUrl: string|null}} - Local and network URLs
 */
function buildUrl(host, port, type, filePath) {
  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  const baseUrl = `http://${displayHost}:${port}`;

  let urlPath = '';
  if (type === 'file') {
    urlPath = `/view?file=${encodeURIComponent(filePath)}`;
  } else if (type === 'directory') {
    urlPath = `/browse?dir=${encodeURIComponent(filePath)}`;
  }

  const url = baseUrl + urlPath;

  // If binding to all interfaces, provide network URL for remote access
  let networkUrl = null;
  if (host === '0.0.0.0') {
    const localIP = getLocalIP();
    if (localIP) {
      networkUrl = `http://${localIP}:${port}${urlPath}`;
    }
  }

  return { url, networkUrl };
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs(process.argv);
  const cwd = process.cwd();
  const assetsDir = path.join(__dirname, '..', 'assets');

  // Handle --stop
  if (args.stop) {
    const instances = findRunningInstances();
    if (instances.length === 0) {
      console.log('No server running to stop');
      process.exit(0);
    }
    const stopped = stopAllServers();
    console.log(`Stopped ${stopped} server(s)`);
    process.exit(0);
  }

  // Determine input
  const input = args.dir || args.file;

  // Validate input
  if (!input) {
    console.error('Error: --file or --dir argument required');
    console.error('Usage:');
    console.error('  node server.cjs --file <path.md> [--port 3456] [--open]');
    console.error('  node server.cjs --dir <path> [--port 3456] [--open]  # Browse directory');
    process.exit(1);
  }

  // Resolve input path - simple logic
  let resolved = resolveInput(input, cwd);

  // If --dir was explicitly used, force directory mode
  if (args.dir && resolved.type === null) {
    const dirPath = path.isAbsolute(args.dir) ? args.dir : path.resolve(cwd, args.dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      resolved = { type: 'directory', path: dirPath };
    }
  }

  if (resolved.type === null) {
    console.error(`Error: Invalid path: ${input}`);
    console.error('Path must be a file or directory.');
    process.exit(1);
  }

  // Background mode - spawn child and exit (legacy mode for manual runs)
  // Skip if --foreground is set (for Claude Code background tasks)
  if (args.background && !args.foreground && !args.isChild) {
    const childArgs = ['--port', String(args.port), '--host', args.host, '--child'];
    if (resolved.type === 'file') {
      childArgs.unshift('--file', resolved.path);
    } else {
      childArgs.unshift('--dir', resolved.path);
    }
    if (args.open) childArgs.push('--open');

    const child = spawn(process.execPath, [__filename, ...childArgs], {
      detached: true,
      stdio: 'ignore',
      cwd: cwd
    });
    child.unref();

    // Wait briefly for child to start
    await new Promise(r => setTimeout(r, 500));

    // Find the port the child is using
    const instances = findRunningInstances();
    const instance = instances.find(i => i.port >= args.port);
    const port = instance ? instance.port : args.port;

    const { url, networkUrl } = buildUrl(args.host, port, resolved.type, resolved.path);

    const result = {
      success: true,
      url,
      path: resolved.path,
      port,
      host: args.host,
      mode: resolved.type
    };
    if (networkUrl) result.networkUrl = networkUrl;

    console.log(JSON.stringify(result));

    process.exit(0);
  }

  // Find available port
  const port = await findAvailablePort(args.port);
  if (port !== args.port) {
    console.error(`Port ${args.port} in use, using ${port}`);
  }

  // Determine allowed directories for security
  const allowedDirs = [assetsDir, cwd];
  if (resolved.path) {
    const targetDir = resolved.type === 'file' ? path.dirname(resolved.path) : resolved.path;
    if (!allowedDirs.includes(targetDir)) {
      allowedDirs.push(targetDir);
    }
  }

  // Create server
  const server = createHttpServer({
    assetsDir,
    renderMarkdown: (fp) => generateFullPage(fp, assetsDir),
    allowedDirs
  });

  // Start server
  server.listen(port, args.host, () => {
    const { url, networkUrl } = buildUrl(args.host, port, resolved.type, resolved.path);

    // Write PID file
    writePidFile(port, process.pid);

    // Setup shutdown handlers
    setupShutdownHandlers(port, () => {
      server.close();
    });

    // Output for CLI/command integration
    // In foreground mode (CC background task), always output JSON
    if (args.foreground || args.isChild || process.env.CLAUDE_COMMAND) {
      const result = {
        success: true,
        url,
        path: resolved.path,
        port,
        host: args.host,
        mode: resolved.type
      };
      if (networkUrl) result.networkUrl = networkUrl;
      console.log(JSON.stringify(result));
    } else {
      console.log(`\nMarkdown Novel Viewer`);
      console.log(`${'─'.repeat(40)}`);
      console.log(`URL: ${url}`);
      if (networkUrl) {
        console.log(`Network: ${networkUrl}`);
      }
      console.log(`Path: ${resolved.path}`);
      console.log(`Port: ${port}`);
      console.log(`Host: ${args.host}`);
      console.log(`Mode: ${resolved.type === 'file' ? 'File Viewer' : 'Directory Browser'}`);
      console.log(`\nPress Ctrl+C to stop\n`);
    }

    // Open browser
    if (args.open) {
      openBrowser(url);
    }
  });

  server.on('error', (err) => {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
  });
}

// Run
main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
