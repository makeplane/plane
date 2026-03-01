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

// helpers
import { API_BASE_URL } from "@plane/constants";
// plane web types
import type { TPagePublishSettings } from "@/types";
// services
import { APIService } from "@/services/api.service";

export class PublishPageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // project level
  async publishProjectPage(
    workspaceSlug: string,
    projectID: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ): Promise<TPagePublishSettings> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectID}/pages/${pageID}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchProjectPagePublishSettings(
    workspaceSlug: string,
    projectID: string,
    pageID: string
  ): Promise<TPagePublishSettings> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectID}/pages/${pageID}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectPagePublishSettings(
    workspaceSlug: string,
    projectID: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ): Promise<TPagePublishSettings> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectID}/pages/${pageID}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unpublishProjectPage(workspaceSlug: string, projectID: string, pageID: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectID}/pages/${pageID}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // workspace level
  async publishWorkspacePage(
    workspaceSlug: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ): Promise<TPagePublishSettings> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageID}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchWorkspacePagePublishSettings(workspaceSlug: string, pageID: string): Promise<TPagePublishSettings> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageID}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspacePagePublishSettings(
    workspaceSlug: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ): Promise<TPagePublishSettings> {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageID}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unpublishWorkspacePage(workspaceSlug: string, pageID: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageID}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
