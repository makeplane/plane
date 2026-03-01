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

// plane types
import { API_BASE_URL } from "@plane/constants";
import type { TPageVersion } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class TeamspacePageVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetch all versions of a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  async fetchAllVersions(workspaceSlug: string, teamspaceId: string, pageId: string): Promise<TPageVersion[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/versions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetch a version of a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @param versionId
   * @returns
   */
  async fetchVersionById(
    workspaceSlug: string,
    teamspaceId: string,
    pageId: string,
    versionId: string
  ): Promise<TPageVersion> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/versions/${versionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Restore a version of a page for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @param versionId
   * @returns
   */
  async restoreVersion(workspaceSlug: string, teamspaceId: string, pageId: string, versionId: string): Promise<void> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${pageId}/versions/${versionId}/restore/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
