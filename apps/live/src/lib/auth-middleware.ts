import type { Request, Response, NextFunction } from "express";
import { logger } from "@plane/logger";
import { env } from "@/env";

/**
 * Express middleware to verify secret key authentication for protected endpoints
 *
 * Checks for secret key in headers:
 * - x-admin-secret-key (preferred for admin endpoints)
 * - live-server-secret-key (for backward compatibility)
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 *
 * @example
 * ```typescript
 * import { Middleware } from "@plane/decorators";
 * import { requireSecretKey } from "@/lib/auth-middleware";
 *
 * @Get("/protected")
 * @Middleware(requireSecretKey)
 * async protectedEndpoint(req: Request, res: Response) {
 *   // This will only execute if secret key is valid
 * }
 * ```
 */
// TODO - Move to hmac
export const requireSecretKey = (req: Request, res: Response, next: NextFunction): void => {
  const secretKey = req.headers["live-server-secret-key"];

  if (!secretKey || secretKey !== env.LIVE_SERVER_SECRET_KEY) {
    logger.warn(`
  ⚠️  [AUTH] Unauthorized access attempt
     Endpoint: ${req.path}
     Method: ${req.method}
     IP: ${req.ip}
     User-Agent: ${req.headers["user-agent"]}
      `);

    res.status(401).json({
      error: "Unauthorized",
      status: 401,
    });
    return;
  }

  // Secret key is valid, proceed to the route handler
  next();
};
