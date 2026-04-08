/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Response } from "express";
import { logger } from "@plane/logger";

const { APP_ENV } = process.env;

export const responseHandler = (res: Response, status: number, data: any = {}, extras: any = undefined) => {
  // Prevent double response - check if headers were already sent
  if (res.headersSent) {
    logger.warn("Attempted to send response after headers were already sent", {
      status,
      originalStatus: res.statusCode,
    });
    return res;
  }

  switch (status) {
    case 200: {
      return res.status(status).json({
        status,
        message: "Successful",
        data,
        extras,
      });
    }
    case 201: {
      return res.status(status).json({
        status,
        message: "Created",
        data,
        extras,
      });
    }
    case 400: {
      return res.status(status).json({
        status,
        message: "Bad Request",
        errors: data,
        extras,
      });
    }
    case 401: {
      return res.status(status).json({
        status,
        message: "Unauthorized",
        errors: data,
        extras,
      });
    }
    case 403: {
      return res.status(status).json({
        status,
        message: "Permission Denied",
        errors: data,
        extras,
      });
    }
    case 404: {
      return res.status(status).json({
        status,
        message: "Not Found",
        errors: data,
        extras,
      });
    }
    case 409: {
      return res.status(status).json({
        status,
        message: "Conflict Occurred",
        errors: data,
        extras,
      });
    }
    case 429: {
      return res.status(status).json({
        status,
        message: "You have exceeded the request limit. Try After 1 hr",
        errors: data,
        extras,
      });
    }
    case 500: {
      logger.error(`[SILo] Error processing response: ${data}`);
      return res.status(status).json({
        status,
        message: "Internal Server Error",
        errors: APP_ENV !== "production" ? data : {},
        extras,
      });
    }
    default: {
      logger.error(`[SILo] Error processing response: ${data}`);
      return res.status(status).json({
        status: 500,
        message: "Default Internal Server Error",
        extras,
      });
    }
  }
};
