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
// helpers
import { API_BASE_URL } from "@plane/constants";
import type { TProjectUpdatesComment } from "@/types";
// services
import { APIService } from "@/services/api.service";
import { FileUploadService } from "@/services/file-upload.service";

export class ProjectUpdateCommentService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  async getProjectUpdateComments(
    workspaceSlug: string,
    projectId: string,
    updateId: string
  ): Promise<TProjectUpdatesComment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/comments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProjectUpdateComment(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    data: Partial<TProjectUpdatesComment>
  ): Promise<TProjectUpdatesComment> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/comments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchProjectUpdateComment(
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    data: Partial<TProjectUpdatesComment>
  ): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${commentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectUpdateComment(workspaceSlug: string, projectId: string, commentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${commentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
