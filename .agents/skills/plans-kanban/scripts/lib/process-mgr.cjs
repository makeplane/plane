/**
 * Process manager for plans-kanban server
 * Handles PID files and server lifecycle
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// Cross-platform temp directory for PID files
const PID_DIR = os.tmpdir();
const PID_PREFIX = 'plans-kanban-';

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
  fs.writeFileSync(getPidFilePath(port), String(pid));
}

/**
 * Read PID from file
 * @param {number} port - Server port
 * @returns {number|null} - PID or null if not found
 */
function readPidFile(port) {
  const pidPath = getPidFilePath(port);
  if (fs.existsSync(pidPath)) {
    return parseInt(fs.readFileSync(pidPath, 'utf8').trim(), 10);
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
 * Find all running kanban server instances
 * @returns {Array<{port: number, pid: number}>}
 */
function findRunningInstances() {
  const instances = [];
  const files = fs.readdirSync(PID_DIR);

  for (const file of files) {
    if (file.startsWith(PID_PREFIX) && file.endsWith('.pid')) {
      const port = parseInt(file.replace(PID_PREFIX, '').replace('.pid', ''), 10);
      const pid = readPidFile(port);
      if (pid) {
        try {
          process.kill(pid, 0);
          instances.push({ port, pid });
        } catch {
          removePidFile(port);
        }
      }
    }
  }

  return instances;
}

/**
 * Stop all running kanban servers
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
  const handler = () => {
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
  stopAllServers,
  setupShutdownHandlers,
  PID_PREFIX
};
