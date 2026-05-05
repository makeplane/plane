#!/usr/bin/env node

/**
 * Plans Kanban Server
 * Background HTTP server for plans dashboard with progress tracking
 *
 * Usage:
 *   node server.cjs --dir ./plans [--port 3500] [--open] [--stop] [--host 0.0.0.0]
 *
 * Options:
 *   --dir <path>    Path to plans directory
 *   --port <number> Server port (default: 3500, auto-increment if busy)
 *   --host <addr>   Host to bind (default: localhost, use 0.0.0.0 for all interfaces)
 *   --open          Auto-open browser after start
 *   --stop          Stop all running kanban servers
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

/**
 * Parse command line arguments
 */
function parseArgs(argv) {
  const args = {
    dir: null,
    port: DEFAULT_PORT,
    host: 'localhost',
    open: false,
    stop: false,
    background: false,
    foreground: false,
    isChild: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--dir' || arg === '--plans') && argv[i + 1]) {
      args.dir = argv[++i];
    } else if (arg === '--port' && argv[i + 1]) {
      args.port = parseInt(argv[++i], 10);
    } else if (arg === '--host' && argv[i + 1]) {
      args.host = argv[++i];
    } else if (arg === '--open') {
      args.open = true;
    } else if (arg === '--stop') {
      args.stop = true;
    } else if (arg === '--background') {
      args.background = true;
    } else if (arg === '--foreground') {
      args.foreground = true;
    } else if (arg === '--child') {
      args.isChild = true;
    } else if (!arg.startsWith('--') && !args.dir) {
      args.dir = arg;
    }
  }

  return args;
}

/**
 * Get local network IP address for remote access
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

/**
 * Build URL with network URL for remote access
 */
function buildUrl(host, port, plansDir) {
  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  const urlPath = `/kanban?dir=${encodeURIComponent(plansDir)}`;
  const url = `http://${displayHost}:${port}${urlPath}`;

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
 * Open browser
 */
function openBrowser(url) {
  const platform = process.platform;
  let cmd;

  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "${url}"`;
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
      console.log('No kanban server running to stop');
      process.exit(0);
    }
    const stopped = stopAllServers();
    console.log(`Stopped ${stopped} kanban server(s)`);
    process.exit(0);
  }

  // Validate input
  if (!args.dir) {
    console.error('Error: --dir argument required');
    console.error('Usage:');
    console.error('  node server.cjs --dir <plans-dir> [--port 3500] [--open]');
    process.exit(1);
  }

  // Resolve plans directory
  const plansDir = path.isAbsolute(args.dir) ? args.dir : path.resolve(cwd, args.dir);

  if (!fs.existsSync(plansDir) || !fs.statSync(plansDir).isDirectory()) {
    console.error(`Error: Directory not found: ${args.dir}`);
    process.exit(1);
  }

  // Background mode - spawn child and exit (legacy mode for manual runs)
  // Skip if --foreground is set (for Claude Code background tasks)
  if (args.background && !args.foreground && !args.isChild) {
    const childArgs = ['--dir', plansDir, '--port', String(args.port), '--host', args.host, '--child'];
    if (args.open) childArgs.push('--open');

    const child = spawn(process.execPath, [__filename, ...childArgs], {
      detached: true,
      stdio: 'ignore',
      cwd: cwd
    });
    child.unref();

    await new Promise(r => setTimeout(r, 500));

    const instances = findRunningInstances();
    const instance = instances.find(i => i.port >= args.port);
    const port = instance ? instance.port : args.port;

    const { url, networkUrl } = buildUrl(args.host, port, plansDir);

    const result = {
      success: true,
      url,
      dir: plansDir,
      port,
      host: args.host,
      mode: 'kanban'
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

  // Determine allowed directories
  const allowedDirs = [assetsDir, cwd, plansDir];

  // Create server
  const server = createHttpServer({
    assetsDir,
    allowedDirs,
    plansDir
  });

  // Start server
  server.listen(port, args.host, () => {
    const { url, networkUrl } = buildUrl(args.host, port, plansDir);

    writePidFile(port, process.pid);
    setupShutdownHandlers(port, () => server.close());

    // Output for CLI/command integration
    // In foreground mode (CC background task), always output JSON
    if (args.foreground || args.isChild || process.env.CLAUDE_COMMAND) {
      const result = {
        success: true,
        url,
        dir: plansDir,
        port,
        host: args.host,
        mode: 'kanban'
      };
      if (networkUrl) result.networkUrl = networkUrl;
      console.log(JSON.stringify(result));
    } else {
      console.log(`\nPlans Kanban Dashboard`);
      console.log(`${'─'.repeat(40)}`);
      console.log(`URL: ${url}`);
      if (networkUrl) {
        console.log(`Network: ${networkUrl}`);
      }
      console.log(`Plans: ${plansDir}`);
      console.log(`Port: ${port}`);
      console.log(`Host: ${args.host}`);
      console.log(`\nPress Ctrl+C to stop\n`);
    }

    if (args.open) {
      openBrowser(url);
    }
  });

  server.on('error', (err) => {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
  });
}

main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
