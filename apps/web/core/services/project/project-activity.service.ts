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
import type { TProjectActivity } from "@/types";
import { APIService } from "@/services/api.service";

export class ProjectActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  async getProjectActivities(workspaceSlug: string, projectId: string): Promise<TProjectActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/history/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
