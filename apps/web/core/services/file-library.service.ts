/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AxiosRequestConfig } from "axios";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { getFileMetaDataForUpload, generateFileUploadPayload } from "@plane/services";
import type { TFileCategory, TLibraryFile, TLibraryFileFilters, TLibraryFileUploadResponse } from "@plane/types";
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

  // files

  async getFiles(workspaceSlug: string, filters?: TLibraryFileFilters): Promise<TLibraryFile[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/file-library/files/`, { params: filters })
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
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<TLibraryFileUploadResponse> {
    const fileMetaData = await getFileMetaDataForUpload(file);
    return this.post(`/api/workspaces/${workspaceSlug}/file-library/files/`, fileMetaData)
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
