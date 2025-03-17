/**
 * @plane/logger
 * 
 * A shared logger for Plane applications that provides consistent
 * logging functionality across all services.
 */

// Export all components from the logger
export * from "./config";
export * from "./middleware";

// Export default logger instance if needed
import { logger } from "./config";
export default logger;
