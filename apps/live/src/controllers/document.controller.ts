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

import type { Request, Response } from "express";
import { z } from "zod";
// helpers
import { Controller, Middleware, Post } from "@plane/decorators";
import { convertHTMLDocumentToAllFormats } from "@plane/editor";
// logger
import { logger } from "@plane/logger";
import { requireSecretKey } from "@/lib/auth-middleware";
import { AppError } from "@/lib/errors";
import type { TConvertDocumentRequestBody } from "@/types";

// Define the schema with more robust validation
const convertDocumentSchema = z.object({
  description_html: z
    .string()
    .min(1, "HTML content cannot be empty")
    .refine((html) => html.trim().length > 0, "HTML content cannot be just whitespace")
    .refine((html) => html.includes("<") && html.includes(">"), "Content must be valid HTML"),
  variant: z.enum(["rich", "document"]),
});

@Controller("/convert-document")
export class DocumentController {
  @Post("/")
  @Middleware(requireSecretKey)
  async convertDocument(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = convertDocumentSchema.parse(req.body as TConvertDocumentRequestBody);
      const { description_html, variant } = validatedData;

      // Process document conversion
      const { description_json, description_binary } = convertHTMLDocumentToAllFormats({
        document_html: description_html,
        variant,
      });

      // Return successful response
      res.status(200).json({
        description_json,
        description_binary,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        logger.error("DOCUMENT_CONTROLLER: Validation error", {
          validationErrors,
        });
        return res.status(400).json({
          message: `Validation error`,
          context: {
            validationErrors,
          },
        });
      } else {
        const appError = new AppError(error);
        logger.error("DOCUMENT_CONTROLLER: Internal server error", appError);
        return res.status(500).json({
          message: `Internal server error.`,
        });
      }
    }
  }
}
