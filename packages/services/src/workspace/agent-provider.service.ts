/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TAgentProvider, TAgentProviderEntry } from "@plane/types";
import { APIService } from "../api.service";

/** Whose credential a call changes: the caller's own, or the one shared with the workspace (admins only). */
export type TAgentProviderCredentialScope = "personal" | "workspace";

/**
 * Per-user and per-workspace AI provider credentials for the agent chat. Secrets are write-only:
 * responses carry the last 4 characters of a key at most.
 */
export class WorkspaceAgentProviderService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /** Every provider, in display order, with the caller's and the workspace's credential state. */
  async list(workspaceSlug: string): Promise<TAgentProviderEntry[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/agent-providers/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Sets an API key, replacing any credential of that scope for the provider. Returns the provider entry. */
  async setApiKey(
    workspaceSlug: string,
    provider: TAgentProvider,
    scope: TAgentProviderCredentialScope,
    apiKey: string
  ): Promise<TAgentProviderEntry> {
    return this.put(`/api/workspaces/${workspaceSlug}/agent-providers/${provider}/${scope}/`, { api_key: apiKey })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Removes the credential of that scope for the provider (any method). */
  async removeCredential(
    workspaceSlug: string,
    provider: TAgentProvider,
    scope: TAgentProviderCredentialScope
  ): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/agent-providers/${provider}/${scope}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
