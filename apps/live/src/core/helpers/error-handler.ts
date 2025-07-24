import { ErrorRequestHandler } from "express";
import { logger } from "@plane/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res) => {
  // Log the error
  logger.error(err);

  // Set the response status
  res.status(err.status || 500);

  // Send the response
  res.json({
    error: {
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
};
