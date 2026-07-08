/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
// api service
import { APIService } from "../api.service";

export type TWorkspaceFeatureKey = "file_library";

export type TInstanceWorkspaceFeatures = {
  workspace_id: string;
  features: Record<TWorkspaceFeatureKey, boolean>;
};

export type TInstanceWorkspaceFeatureUpdate = {
  workspace_id: string;
  key: TWorkspaceFeatureKey;
  is_enabled: boolean;
};

/**
 * Service class for managing per-workspace feature flags from the instance
 * admin (god-mode).
 * @extends {APIService}
 */
export class InstanceWorkspaceFeatureService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Retrieves the feature flags of a workspace
   */
  async list(workspaceId: string): Promise<TInstanceWorkspaceFeatures> {
    return this.get(`/api/instances/workspaces/${workspaceId}/features/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Enables or disables a feature for a workspace
   */
  async update(
    workspaceId: string,
    key: TWorkspaceFeatureKey,
    isEnabled: boolean
  ): Promise<TInstanceWorkspaceFeatureUpdate> {
    return this.patch(`/api/instances/workspaces/${workspaceId}/features/`, {
      key,
      is_enabled: isEnabled,
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
