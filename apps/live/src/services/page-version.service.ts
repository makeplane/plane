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

import { logger } from "@plane/logger";
import type { TPageVersion } from "@plane/types";
import { AppError } from "@/lib/errors";
import { APIService } from "@/services/api.service";

export type TPageType = "project" | "workspace" | "teamspace";

export type TFetchVersionParams = {
  cookie: string;
  workspaceSlug: string;
  pageId: string;
  versionId: string;
  pageType: TPageType;
  projectId?: string;
  teamspaceId?: string;
};

export class PageVersionService extends APIService {
  constructor() {
    super();
  }

  private getVersionsBasePath(params: Omit<TFetchVersionParams, "versionId" | "cookie">): string {
    const { workspaceSlug, pageId, pageType, projectId, teamspaceId } = params;

    switch (pageType) {
      case "project":
        if (!projectId) throw new AppError("projectId is required for project pages");
        return `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/versions`;
      case "teamspace":
        if (!teamspaceId) throw new AppError("teamspaceId is required for teamspace pages");
        return `/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/versions`;
      case "workspace":
        return `/api/workspaces/${workspaceSlug}/pages/${pageId}/versions`;
      default:
        throw new AppError(`Unknown page type: ${pageType}`);
    }
  }

  async fetchVersionById(params: TFetchVersionParams): Promise<TPageVersion> {
    const { cookie, versionId, ...pathParams } = params;
    const basePath = this.getVersionsBasePath(pathParams);

    return this.get(`${basePath}/${versionId}/`, {
      headers: { Cookie: cookie },
    })
      .then((response) => response?.data)
      .catch((error) => {
        const appError = new AppError(error, {
          context: { operation: "fetchVersionById", versionId, ...pathParams },
        });
        logger.error("Failed to fetch version by ID", appError);
        throw appError;
      });
  }
}

export const pageVersionService = new PageVersionService();
