/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import { API_BASE_URL } from "@plane/constants";
import type { TPageVersion } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

/**
 * Version history service for workspace-level (wiki) pages.
 * Mirrors {@link ProjectPageVersionService} but targets `/api/workspaces/:slug/pages/:id/versions/…`.
 */
export class WorkspacePageVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAllVersions(workspaceSlug: string, pageId: string): Promise<TPageVersion[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchVersionById(workspaceSlug: string, pageId: string, versionId: string): Promise<TPageVersion> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/${versionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreVersion(workspaceSlug: string, pageId: string, versionId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/${versionId}/restore/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
