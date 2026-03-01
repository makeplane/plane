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
import { Controller, Get } from "@plane/decorators";
import { computeVersionDiff } from "@plane/editor";
import { logger } from "@plane/logger";
import { handleAuthentication } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { pageVersionService } from "@/services/page-version.service";
import type { TPageType } from "@/services/page-version.service";

const versionDiffQuerySchema = z.object({
  pageId: z.string().min(1, "pageId is required"),
  versionId: z.string().min(1, "versionId is required"),
  previousVersionId: z.string().optional(), // Optional - null for first version
  workspaceSlug: z.string().min(1, "workspaceSlug is required"),
  userId: z.string().min(1, "userId is required"),
  pageType: z.enum(["project", "workspace", "teamspace"]),
  projectId: z.string().optional(),
  teamspaceId: z.string().optional(),
});

@Controller("/version-diff")
export class VersionDiffController {
  @Get("/")
  async getVersionDiff(req: Request, res: Response) {
    try {
      const { cookie } = req.headers;

      if (!cookie || typeof cookie !== "string") {
        return res.status(401).json({
          error: "Authentication required",
          code: "MISSING_AUTHENTICATION",
        });
      }

      const validatedQuery = versionDiffQuerySchema.parse(req.query);
      const { pageId, versionId, previousVersionId, workspaceSlug, userId, pageType, projectId, teamspaceId } =
        validatedQuery;

      // Authenticate user
      try {
        await handleAuthentication({ cookie, userId });
      } catch (_error) {
        return res.status(401).json({
          error: "Authentication failed",
          code: "UNAUTHORIZED",
        });
      }

      // Fetch current and previous versions in parallel
      const fetchParams = {
        cookie,
        workspaceSlug,
        pageId,
        pageType: pageType as TPageType,
        projectId,
        teamspaceId,
      };

      const [currentVersion, previousVersion] = await Promise.all([
        pageVersionService.fetchVersionById({ ...fetchParams, versionId }),
        previousVersionId
          ? pageVersionService.fetchVersionById({ ...fetchParams, versionId: previousVersionId })
          : null,
      ]);

      if (!currentVersion) {
        return res.status(404).json({
          error: "Version not found",
          code: "VERSION_NOT_FOUND",
        });
      }

      if (!currentVersion.description_binary) {
        return res.status(400).json({
          error: "Current version has no binary data",
          code: "MISSING_BINARY_DATA",
        });
      }

      const previousVersionBinary = previousVersion?.description_binary ?? null;

      // Compute diff server-side
      const diffData = computeVersionDiff(currentVersion.description_binary, previousVersionBinary);

      // Return response
      return res.status(200).json({
        currentVersion: {
          id: currentVersion.id,
          last_saved_at: currentVersion.last_saved_at,
          created_by: currentVersion.created_by,
          owned_by: currentVersion.owned_by,
        },
        diffData: {
          docUpdate: diffData.docUpdate,
          oldSnapshot: diffData.oldSnapshot,
          newSnapshot: diffData.newSnapshot,
        },
        editors: diffData.editors,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        logger.error("VERSION_DIFF_CONTROLLER: Validation error", { validationErrors });
        return res.status(400).json({
          error: "Validation error",
          code: "VALIDATION_ERROR",
          context: { validationErrors },
        });
      }

      const appError = new AppError(error);
      logger.error("VERSION_DIFF_CONTROLLER: Internal server error", appError);
      return res.status(500).json({
        error: "Internal server error",
        code: "SERVER_ERROR",
      });
    }
  }
}
