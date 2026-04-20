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
import type { WorkspacePreferences, TExploredFeatures, TTips, TGettingStartedChecklistKeys } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

class WorkspacePreferencesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchPreferences(workspaceSlug: string): Promise<WorkspacePreferences> {
    return this.get(`/api/workspaces/${workspaceSlug}/preferences/`).then((response) => response?.data);
  }

  async updatePreferences(
    workspaceSlug: string,
    data: {
      explored_features?: Partial<Record<TExploredFeatures, boolean>>;
      tips?: Partial<Record<TTips, boolean>>;
      getting_started_checklist?: Partial<Record<TGettingStartedChecklistKeys, boolean>>;
    }
  ): Promise<WorkspacePreferences> {
    return this.patch(`/api/workspaces/${workspaceSlug}/preferences/`, data).then((response) => response?.data);
  }
}

const workspacePreferencesService = new WorkspacePreferencesService();
export default workspacePreferencesService;
