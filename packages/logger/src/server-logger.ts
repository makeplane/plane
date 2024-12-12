import { createLogger, format, LoggerOptions, transports, Logger as WinstonLogger } from "winston";
import winstonRotate from "winston-daily-rotate-file";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { ILoggerOptions } from "index";

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
  static instance?: Logger;
  private logger: WinstonLogger;
  private logLevel?: string;
  private logFilePrefix?: string;

  private constructor(loggerOptions: ILoggerOptions = { logLevel: "info", logFilePrefix: "plane-log" }) {
    this.logLevel = loggerOptions.logLevel;
    this.logFilePrefix = loggerOptions.logFilePrefix;

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

  private static getInstance(loggerOptions?: ILoggerOptions) {
    if (!Logger.instance) {
      Logger.instance = new Logger(loggerOptions);
    } 
    return Logger.instance;
  }

  public static getLogger(loggerOptions?: ILoggerOptions) {
    const instance = Logger.getInstance(loggerOptions);
    return instance.logger
  }

}
  
