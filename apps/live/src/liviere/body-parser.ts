/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: JSON body limit of our page edit endpoints. Django sends a page's whole stored Yjs state
// (base64) and its HTML, so pages above ~100 kB hit express.json()'s default limit (413, and the public API
// answered 503). Only requests carrying the live server secret get the larger limit; the rest fall through
// to the server's default parser. A body parsed here is skipped by that parser.

import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { env } from "@/env";

export const LIVIERE_JSON_LIMIT = "32mb";

const largeJson = express.json({ limit: LIVIERE_JSON_LIMIT });

const hasSecretKey = (req: Request): boolean => {
  const given = req.headers["live-server-secret-key"];
  if (typeof given !== "string" || !env.LIVE_SERVER_SECRET_KEY) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(env.LIVE_SERVER_SECRET_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const liviereJsonParser = (req: Request, res: Response, next: NextFunction): void => {
  if (hasSecretKey(req)) largeJson(req, res, next);
  else next();
};
