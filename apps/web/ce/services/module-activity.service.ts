/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IModuleActivity, TPaginationInfo } from "@plane/types";
import { APIService } from "@/services/api.service";

type TModuleActivityResponse = TPaginationInfo & { results: IModuleActivity[] };

export class ModuleActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchActivities(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    cursor?: string
  ): Promise<TModuleActivityResponse> {
    const params = cursor ? `?cursor=${cursor}` : "";
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/activities/${params}`
    ).then((response) => response?.data);
  }
}
