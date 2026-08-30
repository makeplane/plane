/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { logger } from "@plane/logger";
import { AppError } from "@/lib/errors";
import { APIService } from "@/services/api.service";

export type TSyncEvent = {
  id: string;
  seq: number;
  entity_type: string;
  entity_id: string;
  action: "created" | "updated" | "deleted" | "moved";
  actor: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

/**
 * Calls back into the Django API to replay `SyncEvent`s a client missed while
 * disconnected. Forwards the browser/app's own cookie (same pattern as
 * PageCoreService forwarding it for document persistence) rather than a
 * separate service-to-service secret — the replay endpoint is a normal
 * per-user, workspace-scoped authenticated read.
 */
export class SyncEventService extends APIService {
  

  async replay(
    workspaceSlug: string,
    sinceSeq: number,
    cookie: string,
    deviceId?: string
  ): Promise<{ events: TSyncEvent[]; has_more: boolean }> {
    try {
      const response = await this.get(`/api/workspaces/${workspaceSlug}/sync/replay/`, {
        headers: { Cookie: cookie },
        params: { since_seq: sinceSeq, ...(deviceId ? { device_id: deviceId } : {}) },
      });
      return response?.data as { events: TSyncEvent[]; has_more: boolean };
    } catch (error) {
      const appError = new AppError(error, { context: { operation: "replay", workspaceSlug, sinceSeq } });
      logger.error("Failed to replay sync events", appError);
      throw appError;
    }
  }
}
