import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { env } from "@/env";

// Middleware to verify Sentry signature
export const verifySentrySignature = (request: Request, res: Response, next: NextFunction) => {
  const hmac = crypto.createHmac("sha256", env.SENTRY_CLIENT_SECRET as string);
  if (request.body) {
    const body = JSON.stringify(request.body);
    hmac.update(body ?? "{}", "utf8");
  }
  const digest = hmac.digest("hex");
  if (digest !== request.headers["sentry-hook-signature"]) {
    res.status(401).send({ error: "Invalid signature" });
    return;
  }

  next();
};
