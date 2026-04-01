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
// logger
import { logger } from "@plane/logger";
// lib
import { requireSecretKey } from "@/lib/auth-middleware";
import { AppError } from "@/lib/errors";
import { convertHTMLToMarkdown } from "@/lib/markdown-parser.ts";

export type TCustomComponentsMetaData = {
  file_assets: {
    id: string;
    name: string;
  }[];
  work_item_embeds: {
    id: string;
    project__identifier: string;
    sequence_id: string;
  }[];
  work_item_mentions: {
    id: string;
    project__identifier: string;
    sequence_id: string;
  }[];
  user_mentions: {
    id: string;
    display_name: string;
  }[];
  page_embeds: {
    id: string;
    name: string;
    project_id: string;
  }[];
};

type TConvertHTMLToMarkdownRequestBody = {
  description_html: string;
  id: string;
  meta_data: TCustomComponentsMetaData;
  name: string;
  workspace__slug: string;
};

@Controller("/convert-html-to-markdown")
export class MarkdownConversionController {
  @Post("/")
  @Middleware(requireSecretKey)
  async convertToMarkdown(req: Request, res: Response) {
    const { description_html, id, meta_data, name, workspace__slug } = req.body as TConvertHTMLToMarkdownRequestBody;
    const requestId = crypto.randomUUID();

    const clientInfo = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId,
    };

    try {
      // Validate request body
      if (!description_html || !id) {
        throw new AppError("description_html and id are required", { code: "BAD_REQUEST" });
      }

      const markdown = await convertHTMLToMarkdown({
        description_html,
        name,
        metaData: meta_data,
        workspaceSlug: workspace__slug,
      });

      // Log successful conversion
      logger.info("Markdown conversion successful", {
        ...clientInfo,
      });

      // Return successful response
      res.status(200).json({
        markdown,
      });
    } catch (error) {
      let appError: AppError;

      if (error instanceof z.ZodError) {
        // Handle validation errors
        appError = new AppError(error, {
          statusCode: 500,
          context: {
            errorType: "unprocessable-entity",
            message: "Invalid request data",
            component: "markdown-conversion-controller",
            operation: "convertToMarkdown",
            ...clientInfo,
            validationErrors: error.issues.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
        });
      } else {
        // Handle other errors
        appError = new AppError(error, {
          statusCode: 500,
          context: {
            errorType: "internal",
            message: "Internal server error",
            component: "markdown-conversion-controller",
            operation: "convertToMarkdown",
            ...clientInfo,
          },
        });
      }

      // Log the error
      logger.error("Markdown conversion failed:", appError);

      res.status(appError.statusCode ?? 500).json({
        message: appError.message,
        status: appError.statusCode ?? 500,
        context: appError.context,
      });
    }
  }
}
