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

/* eslint-disable no-useless-catch */

// helpers
import { API_BASE_URL } from "@plane/constants";
// plane web types
import type { TWorkspaceFeature, TWorkspaceFeatures } from "@/types/workspace-feature";
// services
import { APIService } from "@/services/api.service";

export class WorkspaceFeatureService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description fetching workspace features
   * @param { string } workspaceSlug
   * @returns { TWorkspaceFeatures | undefined }
   */
  async fetchWorkspaceFeatures(workspaceSlug: string): Promise<TWorkspaceFeatures | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/features/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description update workspace feature
   * @param { string } workspaceSlug
   * @param { Partial<TWorkspaceFeature> } payload
   * @returns { TWorkspaceFeatures | undefined }
   */
  async updateWorkspaceFeature(
    workspaceSlug: string,
    payload: Partial<TWorkspaceFeature>
  ): Promise<TWorkspaceFeatures | undefined> {
    try {
      const { data } = await this.patch(`/api/workspaces/${workspaceSlug}/features/`, payload);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }
}

const workspaceFeatureService = new WorkspaceFeatureService();

export default workspaceFeatureService;
