import Server from "./server";
import { env } from "./env";
import { logger } from "@plane/logger";

// Log server startup details
logger.info(`Starting Plane Live server in ${env.NODE_ENV} environment`);

// Initialize and start the server
const server = new Server();
server.start();
