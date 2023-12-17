import { RequestHandler } from "express";
import { logger } from "../utils/logger";

const AuthKeyMiddleware: RequestHandler = (req, res, next) => {
  // Retrieve the API key from the request header
  const apiKey = req.headers["x-api-key"];

  // Define the expected API key
  const expectedApiKey = process.env.SEGWAY_KEY;

  // Check if the API key is present and matches the expected key
  if (apiKey === expectedApiKey) {
    // If the key is valid, proceed with the next middleware or route handler
    next();
  } else {
    // If the key is invalid, log the error and send an appropriate response
    logger.error("Invalid API key");
    res.status(401).json({ message: "Invalid API key" });
  }
};

export default AuthKeyMiddleware;
