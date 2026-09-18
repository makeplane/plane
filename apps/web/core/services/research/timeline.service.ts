/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TResearchTimeline, TTimelineFilters } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class ResearchTimelineService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getTimeline(workspaceSlug: string, projectId: string, filters: TTimelineFilters = {}) {
    return this.get(researchEndpoints.projectTimeline(workspaceSlug, projectId), {
      params: Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))),
    })
      .then((res) => res?.data as TResearchTimeline)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  exportUrl(workspaceSlug: string, projectId: string, chain?: string) {
    return `${researchEndpoints.chainExport(workspaceSlug, projectId)}${chain ? `?chain=${chain}` : ""}`;
  }
}
