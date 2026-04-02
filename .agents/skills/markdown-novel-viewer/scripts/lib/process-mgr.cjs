/**
 * Process manager - handles PID files and server lifecycle
 * Used by markdown-novel-viewer server
 */

const fs = require('fs');
const path = require('path');

const PID_DIR = '/tmp';
const PID_PREFIX = 'md-novel-viewer-';

/**
 * Get PID file path for a port
 * @param {number} port - Server port
 * @returns {string} - PID file path
 */
function getPidFilePath(port) {
  return path.join(PID_DIR, `${PID_PREFIX}${port}.pid`);
}

/**
 * Write PID file for running server
 * @param {number} port - Server port
 * @param {number} pid - Process ID
 */
function writePidFile(port, pid) {
  const pidPath = getPidFilePath(port);
  fs.writeFileSync(pidPath, String(pid));
}

/**
 * Read PID from file
 * @param {number} port - Server port
 * @returns {number|null} - PID or null if not found
 */
function readPidFile(port) {
  const pidPath = getPidFilePath(port);
  if (fs.existsSync(pidPath)) {
    const pid = fs.readFileSync(pidPath, 'utf8').trim();
    return parseInt(pid, 10);
  }
  return null;
}

/**
 * Remove PID file
 * @param {number} port - Server port
 */
function removePidFile(port) {
  const pidPath = getPidFilePath(port);
  if (fs.existsSync(pidPath)) {
    fs.unlinkSync(pidPath);
  }
}

/**
 * Find all running server instances
 * @returns {Array<{port: number, pid: number}>} - Running instances
 */
function findRunningInstances() {
  const instances = [];
  const files = fs.readdirSync(PID_DIR);

  for (const file of files) {
    if (file.startsWith(PID_PREFIX) && file.endsWith('.pid')) {
      const port = parseInt(file.replace(PID_PREFIX, '').replace('.pid', ''), 10);
      const pid = readPidFile(port);
      if (pid) {
        // Check if process is actually running
        try {
          process.kill(pid, 0);
          instances.push({ port, pid });
        } catch {
          // Process not running, clean up stale PID file
          removePidFile(port);
        }
      }
    }
  }

  return instances;
}

/**
 * Stop server by port
 * @param {number} port - Server port
 * @returns {boolean} - True if stopped successfully
 */
function stopServer(port) {
  const pid = readPidFile(port);
  if (!pid) return false;

  try {
    process.kill(pid, 'SIGTERM');
    removePidFile(port);
    return true;
  } catch {
    removePidFile(port);
    return false;
  }
}

/**
 * Stop all running servers
 * @returns {number} - Number of servers stopped
 */
function stopAllServers() {
  const instances = findRunningInstances();
  let stopped = 0;

  for (const { port, pid } of instances) {
    try {
      process.kill(pid, 'SIGTERM');
      removePidFile(port);
      stopped++;
    } catch {
      removePidFile(port);
    }
  }

  return stopped;
}

/**
 * Setup graceful shutdown handlers
 * @param {number} port - Server port
 * @param {Function} cleanup - Additional cleanup function
 */
function setupShutdownHandlers(port, cleanup) {
  const handler = (signal) => {
    if (cleanup) cleanup();
    removePidFile(port);
    process.exit(0);
  };

  process.on('SIGTERM', handler);
  process.on('SIGINT', handler);
}

module.exports = {
  getPidFilePath,
  writePidFile,
  readPidFile,
  removePidFile,
  findRunningInstances,
  stopServer,
  stopAllServers,
  setupShutdownHandlers,
  PID_PREFIX
};
