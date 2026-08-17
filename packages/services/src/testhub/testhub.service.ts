/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TTesthubAssetOverlay,
  TTesthubCatalogResponse,
  TTesthubJob,
  TTesthubJobCreate,
  TTesthubRepo,
} from "@plane/types";
import { APIService } from "../api.service";

export class TesthubService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private root(workspaceSlug: string, projectId: string) {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/testhub`;
  }

  async getRepo(workspaceSlug: string, projectId: string): Promise<{ repo: TTesthubRepo | null }> {
    return this.get(`${this.root(workspaceSlug, projectId)}/repo/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bindRepo(
    workspaceSlug: string,
    projectId: string,
    data: { remote_id: string }
  ): Promise<{ repo: TTesthubRepo }> {
    return this.put(`${this.root(workspaceSlug, projectId)}/repo/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCatalog(workspaceSlug: string, projectId: string): Promise<TTesthubCatalogResponse> {
    return this.get(`${this.root(workspaceSlug, projectId)}/catalog/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async sync(workspaceSlug: string, projectId: string): Promise<TTesthubJob> {
    return this.post(`${this.root(workspaceSlug, projectId)}/sync/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getFile(workspaceSlug: string, projectId: string, path: string): Promise<{ path: string; content: string }> {
    return this.get(`${this.root(workspaceSlug, projectId)}/files/`, { params: { path } })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listJobs(workspaceSlug: string, projectId: string): Promise<TTesthubJob[]> {
    return this.get(`${this.root(workspaceSlug, projectId)}/jobs/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getJob(workspaceSlug: string, projectId: string, jobId: string): Promise<TTesthubJob> {
    return this.get(`${this.root(workspaceSlug, projectId)}/jobs/${jobId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createJob(workspaceSlug: string, projectId: string, data: TTesthubJobCreate): Promise<TTesthubJob> {
    return this.post(`${this.root(workspaceSlug, projectId)}/jobs/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listOverlays(
    workspaceSlug: string,
    projectId: string,
    params?: { asset_ref?: string; kind?: string }
  ): Promise<TTesthubAssetOverlay[]> {
    return this.get(`${this.root(workspaceSlug, projectId)}/overlays/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async saveOverlay(
    workspaceSlug: string,
    projectId: string,
    data: { asset_ref: string; kind?: string; payload?: Record<string, unknown> }
  ): Promise<TTesthubAssetOverlay> {
    return this.put(`${this.root(workspaceSlug, projectId)}/overlays/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const testhubService = new TesthubService();
