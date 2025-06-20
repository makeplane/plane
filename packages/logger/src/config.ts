import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston about our colors
winston.addColors(colors);

// Custom format for logging
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info: winston.Logform.TransformableInfo) => `[${info?.timestamp}] ${info.level}: ${info.message}`
  )
);

// Define which transports to use
const transports = [
  // Console transport
  new winston.transports.Console(),

  // Rotating file transport for errors
  new DailyRotateFile({
    filename: path.join(process.cwd(), "logs", "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: process.env.LOG_MAX_SIZE || "20m",
    maxFiles: process.env.LOG_RETENTION || "7d",
    level: "error",
  }),

  // Rotating file transport for all logs
  new DailyRotateFile({
    filename: path.join(process.cwd(), "logs", "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: process.env.LOG_MAX_SIZE || "20m",
    maxFiles: process.env.LOG_RETENTION || "7d",
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  format,
  transports,
});
