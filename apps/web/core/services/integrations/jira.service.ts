/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IJiraImporterForm, IJiraMetadata, IJiraPreviewResponse } from "@plane/types";
import { APIService } from "@/services/api.service";

const integrationServiceType = "jira";

export class JiraImporterService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getJiraPreview(
    workspaceSlug: string,
    params: IJiraMetadata & { jql?: string; issue_type_name?: string }
  ): Promise<IJiraPreviewResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/${integrationServiceType}/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createJiraImporter(workspaceSlug: string, data: IJiraImporterForm): Promise<IJiraPreviewResponse> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${data.project_id}/importers/${integrationServiceType}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
