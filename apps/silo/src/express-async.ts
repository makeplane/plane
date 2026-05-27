/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Express 4 doesn't auto-forward rejected promises from async route
 * handlers — they become unhandled promise rejections and can crash
 * the process. Wrap async handlers with this so any throw inside is
 * caught and surfaced as a 500 (and logged).
 *
 * When we move to Express 5 (which handles this natively) this can
 * be deleted and callers can switch back to plain `async (req, res)`.
 */

import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler =
  (handler: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch((err: unknown) => {
      console.error("[silo] unhandled error in async handler:", err);
      if (!res.headersSent) {
        res.status(500).type("text/plain").send("internal error");
      }
    });
  };
