/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IJiraMetadata, IJiraResponse, IJiraImporterForm } from "@plane/types";
import { APIService } from "@/services/api.service";
// types

export class JiraImporterService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getJiraProjectInfo(workspaceSlug: string, params: IJiraMetadata): Promise<IJiraResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/jira`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createJiraImporter(workspaceSlug: string, data: IJiraImporterForm): Promise<IJiraResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/importers/jira/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
