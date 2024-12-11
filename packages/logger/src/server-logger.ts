import { createLogger, format, transports, Logger as WinstonLogger } from "winston";
import winstonRotate from "winston-daily-rotate-file";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up log directory
const logDirectory = `${__dirname}/logs`;

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
  console.log('Logs folder created');
}


export default class Logger {
  private static instance: Logger;
  private logger: WinstonLogger;
  private logLevel: string;
  private logFilePrefix: string;

  private constructor(logLevel: string = "info", logFilePrefix: string = "plane-log") {
    this.logLevel = logLevel;
    this.logFilePrefix = logFilePrefix;

    this.logger = createLogger({
      level: this.logLevel,
      format: format.combine(
        format.colorize(),
        format.timestamp({
          format: "DD/MMM/YYYY HH:mm:ss",
        }),
        format.printf(({ timestamp, level, message, ...metadata }) => {
          const msg = `[${timestamp}] "${level}" ${message}`;
          const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : "";
          return msg + metaString;
        })
      ),
      transports: [
        new winstonRotate({
            filename: `${logDirectory}/${this.logFilePrefix}-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m', // Optional: maximum size per log file
            maxFiles: '7d', // Keep logs for 7 days
            zippedArchive: true, // Optional: compress archived logs
          }),
      ],
    });

    this.logger.transports.forEach((transport) => {
        transport.on("error", (err) => {
          // Handle the error, log it, or notify as necessary
          const transportType: string = this.getTransportType(transport);
          console.error(`Logging transport error: ${transportType}`, err);
        });
    });

  }

  private getTransportType(transport: any): string {
    if (transport instanceof transports.Console) {
      return "Console";
    } else if (transport instanceof winstonRotate) {
      return "File (Rotation)";
    } else {
      return "Unknown";
    }
  }

  private static getInstance(logLevel?: string, logFilePrefix?: string) {
    if (!Logger.instance) {
      Logger.instance = new Logger(logLevel, logFilePrefix);
    } 
    return Logger.instance;
  }

  public static getLogger(logLevel?: string, logFilePrefix?: string) {
    const instance = Logger.getInstance(logLevel, logFilePrefix);
    return instance.logger
  }

}
  
