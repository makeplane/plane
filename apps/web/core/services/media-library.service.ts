import type { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@plane/constants";

import { APIService } from "@/services/api.service";

export type TMediaArtifact = {
  name: string;
  title: string;
  description?: string | null;
  format: string;
  path: string;
  link: string | null;
  action: string;
  metadata_ref?: string | null;
  meta?: Record<string, unknown>;
  work_item_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type TMediaArtifactPayload = {
  name: string;
  title: string;
  description?: string | null;
  format: string;
  link?: string | null;
  action: string;
  metadata_ref?: string | null;
  meta?: Record<string, unknown>;
  work_item_id?: string | null;
  created_at?: string;
  updated_at?: string;
  path?: string;
};

export type TMediaLibraryManifest = {
  id?: string;
  artifacts?: TMediaArtifact[];
  metadata?: Record<string, Record<string, unknown>>;
};

export type TMediaArtifactsPaginatedResponse = {
  results: TMediaArtifact[];
  total_results?: number;
  total_count?: number;
  total_pages?: number;
  next_cursor?: string;
  prev_cursor?: string;
  next_page_results?: boolean;
  prev_page_results?: boolean;
  count?: number;
};

export type TMediaArtifactsResponse = TMediaArtifact[] | TMediaArtifactsPaginatedResponse;

type TMediaLibraryArtifactsQuery = {
  q?: string;
  filters?: string;
  formats?: string;
  section?: string;
  cursor?: string;
  per_page?: string;
};

type TMediaManifestMetaUpdatePayload = {
  work_item_id: string;
  meta: Record<string, unknown>;
};

type TMediaLibraryPackagePayload = {
  id?: string;
  name: string;
  title: string;
};

export class MediaLibraryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async ensureProjectLibrary(
    workspaceSlug: string,
    projectId: string
  ): Promise<TMediaLibraryManifest | null> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/`)
      .then((response) => response?.data ?? null)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async ensurePackage(
    workspaceSlug: string,
    projectId: string,
    data: TMediaLibraryPackagePayload
  ): Promise<Record<string, unknown> | null> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/`, data)
      .then((response) => response?.data ?? null)
      .catch((error) => {
        if (error?.response?.status === 409) {
          return null;
        }
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async getArtifacts(
    workspaceSlug: string,
    projectId: string,
    packageId: string,
    params?: TMediaLibraryArtifactsQuery
  ): Promise<TMediaArtifactsResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/artifacts/`,
      params ? { params } : {}
    )
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async getArtifactDetail(
    workspaceSlug: string,
    projectId: string,
    packageId: string,
    artifactId: string
  ): Promise<TMediaArtifact[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/artifacts/${encodeURIComponent(
        artifactId
      )}/`
    )
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async uploadArtifact(
    workspaceSlug: string,
    projectId: string,
    packageId: string,
    payload: TMediaArtifactPayload,
    file: File,
    onUploadProgress?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<TMediaArtifact> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", payload.name);
    formData.append("title", payload.title);
    if (payload.description !== undefined) {
      formData.append("description", payload.description ?? "");
    }
    formData.append("format", payload.format);
    formData.append("action", payload.action);
    formData.append("meta", JSON.stringify(payload.meta ?? {}));
    if (payload.work_item_id !== undefined) {
      formData.append("work_item_id", payload.work_item_id ?? "");
    }
    if (payload.link !== undefined) {
      formData.append("link", payload.link ?? "");
    }
    if (payload.created_at) formData.append("created_at", payload.created_at);
    if (payload.updated_at) formData.append("updated_at", payload.updated_at);
    if (payload.path) formData.append("path", payload.path);

    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/artifacts/`,
      formData,
      { onUploadProgress }
    )
      .then((response) => response?.data as TMediaArtifact)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async createArtifact(
    workspaceSlug: string,
    projectId: string,
    packageId: string,
    payload: TMediaArtifactPayload | TMediaArtifactPayload[]
  ): Promise<TMediaArtifact | TMediaArtifact[]> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/artifacts/`,
      payload
    )
      .then((response) => response?.data ?? null)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async deleteArtifact(
    workspaceSlug: string,
    projectId: string,
    packageId: string,
    artifactId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/artifacts/${encodeURIComponent(
        artifactId
      )}/`
    )
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async updateManifestMetadata(
    workspaceSlug: string,
    projectId: string,
    packageId: string,
    payload: TMediaManifestMetaUpdatePayload
  ): Promise<{ updated?: number } | null> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/manifest/`,
      payload
    )
      .then((response) => response?.data ?? null)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }
}
