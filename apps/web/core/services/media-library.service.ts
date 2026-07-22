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

type TMediaManifestArtifactUpdatePayload = {
  artifact_id: string;
  artifact: {
    title?: string | null;
    description?: string | null;
    meta?: Record<string, unknown>;
  };
};

type TMediaLibraryPackagePayload = {
  id?: string;
  name: string;
  title: string;
};

type TCreatePlaylistPayload = {
  original_stream_name: string;
  timestamp: string;
};

export type TCustomPlaylist = {
  id: string;
  event_id: number;
  name: string;
  subtitle?: string | null;
  url: string;
  thumbnail: string | null;
  clip: number;
  clips?: TCustomPlaylistClip[];
};

export type TCustomPlaylistClip = {
  groupValue?: string;
  id: string;
  player?: string;
  primaryDetail?: string;
  result?: string;
  sourceTagId?: string | null;
  subtitle?: string;
  tags?: string[];
  team?: string;
  thumbnail?: string | null;
  timestamp?: string | null;
  title: string;
};

type TCustomPlaylistPayload = {
  event_id: number;
  name: string;
  subtitle?: string | null;
  url: string;
  thumbnail?: string | null;
  clip?: number;
  clips?: TCustomPlaylistClip[];
  project_id?: string;
  workspace_slug?: string;
};

export type TCustomPlaylistUpdatePayload = {
  name?: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  clip?: number;
  clips?: TCustomPlaylistClip[];
};

type TCustomPlaylistListParams = {
  projectId?: string;
  workspaceSlug?: string;
};

const sanitizePlaylistFileName = (value: string) => {
  const normalizedValue = value.trim();
  return /^[A-Za-z0-9_-]+\.m3u8$/i.test(normalizedValue) ? normalizedValue : "";
};

const readPlaylistFileName = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const fileName = readPlaylistFileName(entry);
      if (fileName) {
        return fileName;
      }
    }
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directFileName = record["file-name"];
  if (typeof directFileName === "string") {
    const normalized = sanitizePlaylistFileName(directFileName);
    if (normalized) {
      return normalized;
    }
  }

  if (record.field === "file-name" && typeof record.value === "string") {
    const normalized = sanitizePlaylistFileName(record.value);
    if (normalized) {
      return normalized;
    }
  }

  if ("Gateway Response" in record) {
    const gatewayFileName = readPlaylistFileName(record["Gateway Response"]);
    if (gatewayFileName) {
      return gatewayFileName;
    }
  }

  if ("result" in record) {
    const resultFileName = readPlaylistFileName(record.result);
    if (resultFileName) {
      return resultFileName;
    }
  }

  return readPlaylistFileName(Object.values(record));
};

export class MediaLibraryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async ensureProjectLibrary(
    workspaceSlug: string,
    projectId: string,
    config?: AxiosRequestConfig
  ): Promise<TMediaLibraryManifest | null> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/`, {}, config)
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
    params?: TMediaLibraryArtifactsQuery,
    config?: AxiosRequestConfig
  ): Promise<TMediaArtifactsResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/artifacts/`,
      params ? { params } : {},
      config
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

  async createPlaylist(payload: TCreatePlaylistPayload[]): Promise<string | null> {
    const cpServerBaseUrl = process.env.NEXT_PUBLIC_CP_SERVER_URL?.replace(/\/$/, "") ?? "";
    if (!cpServerBaseUrl) {
      throw new Error("NEXT_PUBLIC_CP_SERVER_URL is not configured.");
    }

    return this.post(`${cpServerBaseUrl}/query-engine/create-playlist`, payload, { withCredentials: false })
      .then((response) => readPlaylistFileName(response?.data))
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async createCustomPlaylist(payload: TCustomPlaylistPayload): Promise<TCustomPlaylist> {
    return this.post("/api/custom-playlists/", payload)
      .then((response) => response?.data as TCustomPlaylist)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async getCustomPlaylists(eventId: string, params: TCustomPlaylistListParams = {}): Promise<TCustomPlaylist[]> {
    return this.get("/api/custom-playlists/", {
      params: {
        event_id: eventId,
        project_id: params.projectId,
        workspace_slug: params.workspaceSlug,
      },
    })
      .then((response) => (Array.isArray(response?.data) ? (response.data as TCustomPlaylist[]) : []))
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async updateCustomPlaylist(playlistId: string, payload: TCustomPlaylistUpdatePayload): Promise<TCustomPlaylist> {
    return this.patch(`/api/custom-playlists/${playlistId}/`, payload)
      .then((response) => response?.data as TCustomPlaylist)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async deleteCustomPlaylist(playlistId: string): Promise<void> {
    return this.delete(`/api/custom-playlists/${playlistId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data ?? error?.response ?? error;
      });
  }

  async deleteArtifact(workspaceSlug: string, projectId: string, packageId: string, artifactId: string): Promise<void> {
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

  async updateManifestArtifacts(
    workspaceSlug: string,
    projectId: string,
    packageId: string,
    payload: TMediaManifestArtifactUpdatePayload
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
