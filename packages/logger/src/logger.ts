import { Logger as WinstonLogger } from 'winston';

export interface ILogger {
  logger: WinstonLogger; // The Winston logger instance
  logLevel?: string; // The current logging level
  logFilePrefix?: string;

  // Method to get the logger instance
  getLogger(logLevel?: string, logFilePrefix?: string): WinstonLogger;
}


let Logger: ILogger;

if (typeof window !== "undefined") {
  // Client-side logic
  console.log("inside client logger import")
  Logger = require('./client-logger').default;
} else {
  // Server-side logic
  Logger = require('./server-logger').default;
}

export default Logger;
