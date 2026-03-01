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

import { APIService } from "@/services/api.service";
// types
import type { ClientOptions, ExIssue, Paginated } from "@/types/types";

export class EpicService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async list(slug: string, projectId: string): Promise<Paginated<ExIssue>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/epics/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEpic(slug: string, projectId: string, epicId: string): Promise<ExIssue> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/epics/${epicId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
