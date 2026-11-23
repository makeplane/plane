/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TDescriptionVersionsListResponse, TDescriptionVersionDetails } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class IntakeWorkItemVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listDescriptionVersions(
    workspaceSlug: string,
    projectId: string,
    intakeWorkItemId: string
  ): Promise<TDescriptionVersionsListResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-work-items/${intakeWorkItemId}/description-versions/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveDescriptionVersion(
    workspaceSlug: string,
    projectId: string,
    intakeWorkItemId: string,
    versionId: string
  ): Promise<TDescriptionVersionDetails> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-work-items/${intakeWorkItemId}/description-versions/${versionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
