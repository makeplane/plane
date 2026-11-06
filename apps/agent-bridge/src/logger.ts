/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { logger as planeLogger } from "@plane/logger";

/** Structured logging: a message plus a flat metadata object. Never pass tokens, env or cookies. */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export function createLogger(service: string, base: Record<string, unknown> = {}): Logger {
  const child = planeLogger.child({ service, ...base });
  return {
    debug: (message, meta) => child.debug(message, meta),
    info: (message, meta) => child.info(message, meta),
    warn: (message, meta) => child.warn(message, meta),
    error: (message, meta) => child.error(message, meta),
  };
}

/** Bind extra metadata to every line. */
export function withMeta(log: Logger, base: Record<string, unknown>): Logger {
  return {
    debug: (message, meta) => log.debug(message, { ...base, ...meta }),
    info: (message, meta) => log.info(message, { ...base, ...meta }),
    warn: (message, meta) => log.warn(message, { ...base, ...meta }),
    error: (message, meta) => log.error(message, { ...base, ...meta }),
  };
}

export const silentLogger: Logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} };
