/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Service for the Team Operations Dashboard (`/dashboard/` singular
 * routes — distinct from the retired `/dashboards/` CRUD).
 *
 * Endpoints (mirrors `apps/api/plane/app/views/dashboard.py`):
 *
 * - `POST /api/workspaces/{slug}/dashboard/overview/`
 * - `POST /api/workspaces/{slug}/dashboard/attention/`
 * - `POST /api/workspaces/{slug}/dashboard/items/`
 *
 * The /workload, /projects and /timeline standalone endpoints are owned
 * by backend Task 3; they share the same envelope. Until they ship, the
 * frontend surfaces a `status: "unavailable"` section (never a silent 0).
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TDashboardAttentionPayload,
  TDashboardAttentionResponse,
  TDashboardItemsPayload,
  TDashboardItemsResponse,
  TDashboardOverviewResponse,
  TDashboardScopePayload,
  TDashboardStandalonePayload,
  TStandaloneEnvelope,
  TWorkloadData,
  TProjectsData,
  TTimelineData,
} from "@plane/types";

import { APIService } from "./api.service";

export class DashboardOperationsService extends APIService {
  constructor(baseURL: string = API_BASE_URL) {
    super(baseURL);
  }

  /**
   * `POST /api/workspaces/{slug}/dashboard/overview/` — composed overview
   * sections: kpis, progress, delivery, top_projects, attention_preview,
   * workload_preview (deferred to Task 3), request_meta.
   */
  async overview(
    workspaceSlug: string,
    payload: TDashboardScopePayload = {},
    signal?: AbortSignal
  ): Promise<TDashboardOverviewResponse> {
    const config = signal ? { signal } : undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/dashboard/overview/`, payload, config)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data ?? err;
      });
  }

  /**
   * `POST /api/workspaces/{slug}/dashboard/attention/` — paginated
   * attention union rows + per-rule reason counts.
   */
  async attention(
    workspaceSlug: string,
    payload: TDashboardAttentionPayload = {},
    signal?: AbortSignal
  ): Promise<TDashboardAttentionResponse> {
    const config = signal ? { signal } : undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/dashboard/attention/`, payload, config)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data ?? err;
      });
  }

  /**
   * `POST /api/workspaces/{slug}/dashboard/items/` — paginated drilldown
   * for KPI/rule/member/project/date-bucket selections.
   */
  async items(
    workspaceSlug: string,
    payload: TDashboardItemsPayload = {},
    signal?: AbortSignal
  ): Promise<TDashboardItemsResponse> {
    const config = signal ? { signal } : undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/dashboard/items/`, payload, config)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data ?? err;
      });
  }

  /**
   * `POST /api/workspaces/{slug}/dashboard/workload/` — Task 3 endpoint.
   * Returns the per-member workload rows + unassigned / inactive buckets
   * + workspace-wide distinct totals + WIP threshold rule.
   */
  async workload(
    workspaceSlug: string,
    payload: TDashboardStandalonePayload = {},
    signal?: AbortSignal
  ): Promise<TStandaloneEnvelope<TWorkloadData>> {
    const config = signal ? { signal } : undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/dashboard/workload/`, payload, config)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data ?? err;
      });
  }

  /**
   * `POST /api/workspaces/{slug}/dashboard/projects/` — Task 3 endpoint.
   */
  async projects(
    workspaceSlug: string,
    payload: TDashboardStandalonePayload = {},
    signal?: AbortSignal
  ): Promise<TStandaloneEnvelope<TProjectsData>> {
    const config = signal ? { signal } : undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/dashboard/projects/`, payload, config)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data ?? err;
      });
  }

  /**
   * `POST /api/workspaces/{slug}/dashboard/timeline/` — Task 3 endpoint.
   * The payload carries the three independent paging cursors (cycles,
   * deadlines, unscheduled) and a shared `page_size`.
   */
  async timeline(
    workspaceSlug: string,
    payload: TDashboardStandalonePayload = {},
    signal?: AbortSignal
  ): Promise<TStandaloneEnvelope<TTimelineData>> {
    const config = signal ? { signal } : undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/dashboard/timeline/`, payload, config)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data ?? err;
      });
  }
}

export const dashboardOperationsService = new DashboardOperationsService();
