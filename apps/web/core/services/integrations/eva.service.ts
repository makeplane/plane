/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IEvaImporterForm, IEvaMetadata, IEvaPreviewResponse } from "@plane/types";
import { APIService } from "@/services/api.service";

const integrationServiceType = "eva";

export class EvaImporterService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getEvaPreview(workspaceSlug: string, params: IEvaMetadata): Promise<IEvaPreviewResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/${integrationServiceType}/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createEvaImporter(workspaceSlug: string, data: IEvaImporterForm): Promise<IEvaPreviewResponse> {
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
