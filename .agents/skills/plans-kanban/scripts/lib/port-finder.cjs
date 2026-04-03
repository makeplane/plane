/**
 * Port finder utility for plans-kanban server
 * Uses port range 3500-3550 to avoid conflicts with markdown-novel-viewer
 */

const net = require('net');

const DEFAULT_PORT = 3500;
const PORT_RANGE_END = 3550;

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

/**
 * Find first available port in range
 * @param {number} startPort - Starting port (default: 3500)
 * @returns {Promise<number>} - Available port
 * @throws {Error} - If no port available in range
 */
async function findAvailablePort(startPort = DEFAULT_PORT) {
  for (let port = startPort; port <= PORT_RANGE_END; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port in range ${startPort}-${PORT_RANGE_END}`);
}

module.exports = {
  isPortAvailable,
  findAvailablePort,
  DEFAULT_PORT,
  PORT_RANGE_END
};
