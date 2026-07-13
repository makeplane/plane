/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AxiosRequestConfig } from "axios";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { getFileMetaDataForUpload, generateFileUploadPayload } from "@plane/services";
import type {
  TFileCategory,
  TFileFolder,
  TFileTag,
  TLibraryBulkAction,
  TLibraryFile,
  TLibraryFileFilters,
  TLibraryFileUploadResponse,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";
import { FileUploadService } from "@/services/file-upload.service";

export class FileLibraryService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    this.fileUploadService = new FileUploadService();
  }

  // categories

  async getCategories(workspaceSlug: string): Promise<TFileCategory[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/file-categories/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createCategory(workspaceSlug: string, data: Partial<TFileCategory>): Promise<TFileCategory> {
    return this.post(`/api/workspaces/${workspaceSlug}/file-categories/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCategory(
    workspaceSlug: string,
    categoryId: string,
    data: Partial<TFileCategory>
  ): Promise<TFileCategory> {
    return this.patch(`/api/workspaces/${workspaceSlug}/file-categories/${categoryId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCategory(workspaceSlug: string, categoryId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/file-categories/${categoryId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // folders

  async getFolders(workspaceSlug: string): Promise<TFileFolder[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/file-folders/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createFolder(workspaceSlug: string, data: Partial<TFileFolder>): Promise<TFileFolder> {
    return this.post(`/api/workspaces/${workspaceSlug}/file-folders/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateFolder(workspaceSlug: string, folderId: string, data: Partial<TFileFolder>): Promise<TFileFolder> {
    return this.patch(`/api/workspaces/${workspaceSlug}/file-folders/${folderId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteFolder(workspaceSlug: string, folderId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/file-folders/${folderId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // tags

  async getTags(workspaceSlug: string): Promise<TFileTag[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/file-tags/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createTag(workspaceSlug: string, data: Partial<TFileTag>): Promise<TFileTag> {
    return this.post(`/api/workspaces/${workspaceSlug}/file-tags/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateTag(workspaceSlug: string, tagId: string, data: Partial<TFileTag>): Promise<TFileTag> {
    return this.patch(`/api/workspaces/${workspaceSlug}/file-tags/${tagId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteTag(workspaceSlug: string, tagId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/file-tags/${tagId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // tag links

  async addFileTags(workspaceSlug: string, assetId: string, tagIds: string[]): Promise<TLibraryFile> {
    return this.post(`/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/tags/`, { tag_ids: tagIds })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeFileTag(workspaceSlug: string, assetId: string, tagId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/tags/${tagId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // bulk

  async bulkAction(workspaceSlug: string, payload: TLibraryBulkAction): Promise<{ status: string; skipped?: string[] }> {
    return this.post(`/api/workspaces/${workspaceSlug}/file-library/files/bulk/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // exports (unbounded ZIP builds on the background worker)

  async createBulkExport(workspaceSlug: string, assetIds: string[]): Promise<{ export_id: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/file-library/export/`, { asset_ids: assetIds })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getExportStatus(
    workspaceSlug: string,
    exportId: string
  ): Promise<{ status: "queued" | "processing" | "completed" | "failed"; url: string | null; reason: string | null }> {
    return this.get(`/api/workspaces/${workspaceSlug}/file-library/export/status/${exportId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // files

  async getFiles(workspaceSlug: string, filters?: TLibraryFileFilters): Promise<TLibraryFile[]> {
    // Build a query where multi-value filters repeat their key
    // (?category=a&category=b), which Django's request.getlist() expects.
    const params = new URLSearchParams();
    (filters?.categories ?? []).forEach((id) => params.append("category", id));
    (filters?.tags ?? []).forEach((id) => params.append("tag", id));
    if (filters?.search) params.set("search", filters.search);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.order) params.set("order", filters.order);
    const query = params.toString();
    return this.get(`/api/workspaces/${workspaceSlug}/file-library/files/${query ? `?${query}` : ""}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  private async confirmUpload(workspaceSlug: string, assetId: string): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadFile(
    workspaceSlug: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"],
    folderId?: string | null
  ): Promise<TLibraryFileUploadResponse> {
    const fileMetaData = await getFileMetaDataForUpload(file);
    return this.post(`/api/workspaces/${workspaceSlug}/file-library/files/`, {
      ...fileMetaData,
      folder_id: folderId ?? undefined,
    })
      .then(async (response) => {
        const uploadResponse: TLibraryFileUploadResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(uploadResponse as any, file);
        await this.fileUploadService.uploadFile(
          uploadResponse.upload_data.url,
          fileUploadPayload,
          uploadProgressHandler
        );
        await this.confirmUpload(workspaceSlug, uploadResponse.asset_id);
        return uploadResponse;
      })
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async deleteFile(workspaceSlug: string, assetId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  getFileViewUrl(workspaceSlug: string, assetId: string): string {
    return `${API_BASE_URL}/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/download/`;
  }

  /** Resolves the storage presigned URL so in-app viewers can fetch the file directly */
  async getPresignedViewUrl(workspaceSlug: string, assetId: string): Promise<string> {
    return this.get(`/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/download/`, {
      params: { response: "json" },
    })
      .then((response) => response?.data?.url)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  getFileDownloadUrl(workspaceSlug: string, assetId: string): string {
    return `${API_BASE_URL}/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/download/?download=1`;
  }

  // category links

  async addFileCategories(workspaceSlug: string, assetId: string, categoryIds: string[]): Promise<TLibraryFile> {
    return this.post(`/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/categories/`, {
      category_ids: categoryIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeFileCategory(workspaceSlug: string, assetId: string, categoryId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/file-library/files/${assetId}/categories/${categoryId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const fileLibraryService = new FileLibraryService();
