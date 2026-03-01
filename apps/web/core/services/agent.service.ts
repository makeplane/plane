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

// helpers
import { API_BASE_URL } from "@plane/constants";
// services
import type { TAgentRun, TAgentRunActivitiesResponse } from "@plane/types";
import { APIService } from "@/services/api.service";
import type { AxiosError, AxiosResponse } from "axios";

export class AgentRunService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getAgentRun(workspaceSlug: string, runId: string): Promise<TAgentRun> {
    return this.get(`/api/workspaces/${workspaceSlug}/runs/${runId}/`)
      .then((res: AxiosResponse<TAgentRun>) => res?.data)
      .catch((err: AxiosError) => {
        throw err?.response?.data;
      });
  }

  async getAgentRunActivities(
    workspaceSlug: string,
    runId: string,
    cursor?: string,
    perPage: number = 40
  ): Promise<TAgentRunActivitiesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/runs/${runId}/activities/`, {
      params: {
        cursor,
        per_page: perPage,
      },
    })
      .then((res: AxiosResponse<TAgentRunActivitiesResponse>) => res?.data)
      .catch((err: AxiosError) => {
        throw err?.response?.data;
      });
  }
}
