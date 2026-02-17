/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LoggerOptions } from "winston";
import { createLogger, format, transports } from "winston";

export const loggerConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss:ms",
    }),
    format.json()
  ),
  transports: [new transports.Console()],
};

export const logger = createLogger(loggerConfig);
