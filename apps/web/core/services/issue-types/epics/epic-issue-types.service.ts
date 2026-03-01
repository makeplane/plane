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

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  IIssueTypesService,
  TFetchIssueTypesPayload,
  TIssueType,
  TEnableIssueTypePayload,
  TDisableIssueTypePayload,
  TFetchIssueTypesProjectLevelPayload,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

class EpicIssueTypesService extends APIService implements IIssueTypesService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll({ workspaceSlug }: TFetchIssueTypesPayload): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/epic-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchAllProjectLevel({ workspaceSlug, projectId }: TFetchIssueTypesProjectLevelPayload): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async enable({ workspaceSlug, projectId }: TEnableIssueTypePayload): Promise<TIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-status/`, {
      is_epic_enabled: true,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async disable({ workspaceSlug, projectId }: TDisableIssueTypePayload): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-status/`, {
      is_epic_enabled: false,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const epicIssueTypeService = new EpicIssueTypesService();
