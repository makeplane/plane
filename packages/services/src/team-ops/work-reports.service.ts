/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TReportBoard,
  TReportBoardParams,
  TReportKindName,
  TWorkReport,
  TWorkReportDetail,
  TWorkReportPayload,
} from "@plane/types";
// services
import { APIService } from "../api.service";

export class WorkReportService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/team-ops/work-reports`;
  }

  /** One person's reports whose period starts between `from` and `to` (the caller's own by default). */
  async list(
    workspaceSlug: string,
    params: { kind: TReportKindName; from: string; to: string; user?: string }
  ): Promise<TWorkReport[]> {
    return this.get(`${this.base(workspaceSlug)}/`, { params })
      .then((response) => response?.data?.results)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** One report, or an empty one, with the Time Tracking suggestions of its period. */
  async getReport(
    workspaceSlug: string,
    kind: TReportKindName,
    date: string,
    user?: string
  ): Promise<TWorkReportDetail> {
    return this.get(`${this.base(workspaceSlug)}/${kind}/${date}/`, { params: user ? { user } : {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Saves the caller's own report; `submit: true` hands it in. */
  async saveReport(
    workspaceSlug: string,
    kind: TReportKindName,
    date: string,
    data: TWorkReportPayload
  ): Promise<TWorkReport> {
    return this.put(`${this.base(workspaceSlug)}/${kind}/${date}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Who has handed in their reports. Needs the right to see the team. */
  async getBoard(workspaceSlug: string, params: TReportBoardParams): Promise<TReportBoard> {
    return this.get(`${this.base(workspaceSlug)}/board/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
