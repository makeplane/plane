/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TLeaveAction, TLeaveRequest, TLeaveRequestPayload } from "@plane/types";
// services
import { APIService } from "../api.service";

export class LeaveRequestService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/team-ops/leave-requests`;
  }

  /** `mine`: the caller's requests. `review`: pending requests the caller may decide. */
  async list(workspaceSlug: string, scope: "mine" | "review" = "mine"): Promise<TLeaveRequest[]> {
    return this.get(`${this.base(workspaceSlug)}/`, { params: { scope } })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: TLeaveRequestPayload): Promise<TLeaveRequest> {
    return this.post(`${this.base(workspaceSlug)}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Approve or reject (managers), or cancel (the person, while pending). */
  async act(workspaceSlug: string, requestId: string, action: TLeaveAction, note = ""): Promise<TLeaveRequest> {
    return this.post(`${this.base(workspaceSlug)}/${requestId}/`, { action, note })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
