/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TGitSyncBindingList,
  TGitSyncBindingWrite,
  TGitSyncRemoteList,
  TGitSyncRemoteWrite,
  TGitSyncSyncResponse,
  TProjectGitRemote,
} from "@plane/types";
import { APIService } from "../api.service";

export class GitsyncService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private root(workspaceSlug: string, projectId: string) {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/gitsync`;
  }

  async listRemotes(workspaceSlug: string, projectId: string): Promise<TGitSyncRemoteList> {
    return this.get(`${this.root(workspaceSlug, projectId)}/remotes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createRemote(
    workspaceSlug: string,
    projectId: string,
    data: TGitSyncRemoteWrite
  ): Promise<{ remote: TProjectGitRemote }> {
    return this.post(`${this.root(workspaceSlug, projectId)}/remotes/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateRemote(
    workspaceSlug: string,
    projectId: string,
    remoteId: string,
    data: Partial<TGitSyncRemoteWrite>
  ): Promise<{ remote: TProjectGitRemote }> {
    return this.put(`${this.root(workspaceSlug, projectId)}/remotes/${remoteId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteRemote(workspaceSlug: string, projectId: string, remoteId: string): Promise<void> {
    return this.delete(`${this.root(workspaceSlug, projectId)}/remotes/${remoteId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async syncRemote(workspaceSlug: string, projectId: string, remoteId: string): Promise<TGitSyncSyncResponse> {
    return this.post(`${this.root(workspaceSlug, projectId)}/remotes/${remoteId}/sync/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listBindings(workspaceSlug: string, projectId: string): Promise<TGitSyncBindingList> {
    return this.get(`${this.root(workspaceSlug, projectId)}/bindings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async saveBindings(
    workspaceSlug: string,
    projectId: string,
    bindings: TGitSyncBindingWrite[]
  ): Promise<TGitSyncBindingList> {
    return this.put(`${this.root(workspaceSlug, projectId)}/bindings/`, { bindings })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const gitsyncService = new GitsyncService();
