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

import { API_BASE_URL } from "@plane/constants";

// services
import type { TInitiativeLabel } from "@plane/types";
// types
import { APIService } from "@/services/api.service";

export class InitiativeLabelsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getInitiativeLabels(workspaceSlug: string): Promise<TInitiativeLabel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createInitiativeLabel(workspaceSlug: string, data: Partial<TInitiativeLabel>): Promise<TInitiativeLabel> {
    return this.post(`/api/workspaces/${workspaceSlug}/initiatives/labels/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateInitiativeLabel(
    workspaceSlug: string,
    labelId: string,
    data: Partial<TInitiativeLabel>
  ): Promise<TInitiativeLabel> {
    return this.patch(`/api/workspaces/${workspaceSlug}/initiatives/labels/${labelId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteInitiativeLabel(workspaceSlug: string, labelId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/initiatives/labels/${labelId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
