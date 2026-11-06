/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TWorkspaceAgent } from "@plane/types";
import { APIService } from "../api.service";

/** Agents a workspace member can chat with. Never carries credentials. */
export class WorkspaceAgentService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /** Enabled agents, in the admin's order. */
  async list(workspaceSlug: string): Promise<TWorkspaceAgent[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/agents/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
