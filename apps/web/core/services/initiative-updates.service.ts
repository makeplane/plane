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
import { API_BASE_URL } from "@plane/constants";
import type { EUpdateStatus, TUpdate } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export interface IInitiativeUpdateService {
  getUpdates: (
    workspaceSlug: string,
    initiativeId: string,
    params?: { search: EUpdateStatus }
  ) => Promise<{ project_updates: TUpdate[]; epic_updates: TUpdate[] }>;
}
export class InitiativesUpdateService extends APIService implements IInitiativeUpdateService {
  constructor() {
    super(API_BASE_URL);
  }

  async getUpdates(
    workspaceSlug: string,
    initiativeId: string,
    params?: { search: EUpdateStatus }
  ): Promise<{
    project_updates: TUpdate[];
    epic_updates: TUpdate[];
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/updates/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
