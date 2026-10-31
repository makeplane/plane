/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TControlParams,
  TControlTeam,
  TFlowOverview,
  THubMessage,
  THubOverview,
  TInterruptionRow,
} from "@plane/types";
// services
import { APIService } from "../api.service";

const fail = (error: { response?: { data?: unknown } }) => {
  throw error?.response?.data;
};

/** What managers see: people's tasks and hours, the Hub and the flows. The server checks every right. */
export class ControlService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/team-ops/control`;
  }

  async getTeam(workspaceSlug: string, params: TControlParams): Promise<TControlTeam> {
    return this.get(`${this.base(workspaceSlug)}/team/`, { params })
      .then((response) => response?.data)
      .catch(fail);
  }

  /** The table as a CSV file. */
  async exportTeam(workspaceSlug: string, params: TControlParams): Promise<Blob> {
    return this.get(
      `${this.base(workspaceSlug)}/team/`,
      { params: { ...params, export: "csv" } },
      { responseType: "blob" }
    )
      .then((response) => response?.data)
      .catch(fail);
  }

  async listInterruptions(
    workspaceSlug: string,
    params: TControlParams & { kind?: "BREAK" | "FREEZE" }
  ): Promise<TInterruptionRow[]> {
    return this.get(`${this.base(workspaceSlug)}/interruptions/`, { params })
      .then((response) => response?.data?.results)
      .catch(fail);
  }

  async getHub(workspaceSlug: string): Promise<THubOverview> {
    return this.get(`${this.base(workspaceSlug)}/hub/`)
      .then((response) => response?.data)
      .catch(fail);
  }

  /** Locks a channel so only admins write in it, or opens it again. */
  async setChannelLocked(workspaceSlug: string, channelId: string, isLocked: boolean): Promise<void> {
    return this.patch(`${this.base(workspaceSlug)}/hub/channels/${channelId}/`, { is_locked: isLocked })
      .then(() => undefined)
      .catch(fail);
  }

  async listChannelMessages(workspaceSlug: string, channelId: string): Promise<THubMessage[]> {
    return this.get(`${this.base(workspaceSlug)}/hub/channels/${channelId}/`)
      .then((response) => response?.data?.results)
      .catch(fail);
  }

  async removeMessage(workspaceSlug: string, messageId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/hub/messages/${messageId}/`)
      .then(() => undefined)
      .catch(fail);
  }

  async getFlows(workspaceSlug: string): Promise<TFlowOverview> {
    return this.get(`${this.base(workspaceSlug)}/flows/`)
      .then((response) => response?.data)
      .catch(fail);
  }
}
