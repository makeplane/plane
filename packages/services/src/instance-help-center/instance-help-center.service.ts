/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  IHelpArticle,
  IHelpArticleCreate,
  IHelpArticleTranslationUpsert,
  IHelpArticleUpdate,
  IHelpCategory,
  IHelpCategoryCreate,
  IHelpCategoryUpdate,
  THelpBundleImportResult,
  THelpLocale,
  TFileSignedURLResponse,
} from "@plane/types";
import { APIService } from "../api.service";
import { FileUploadService } from "../file/file-upload.service";
import { generateFileUploadPayload, getFileMetaDataForUpload } from "../file/helper";

/**
 * God Mode (instance-admin) authoring of the shared, instance-global Help Center.
 * Hits the license-layer endpoints under /api/instances/help/... — no workspace scope.
 */
export class InstanceHelpCenterService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    this.fileUploadService = new FileUploadService();
  }

  // ── Categories ───────────────────────────────────────────────────────────

  async listCategories(): Promise<IHelpCategory[]> {
    return this.get("/api/instances/help/categories/")
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createCategory(data: IHelpCategoryCreate): Promise<IHelpCategory> {
    return this.post("/api/instances/help/categories/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateCategory(id: string, data: IHelpCategoryUpdate): Promise<IHelpCategory> {
    return this.patch(`/api/instances/help/categories/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteCategory(id: string): Promise<void> {
    return this.delete(`/api/instances/help/categories/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Articles ─────────────────────────────────────────────────────────────

  async listArticles(categoryId?: string): Promise<IHelpArticle[]> {
    const query = categoryId ? `?category=${categoryId}` : "";
    return this.get(`/api/instances/help/articles/${query}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getArticle(id: string): Promise<IHelpArticle> {
    return this.get(`/api/instances/help/articles/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createArticle(data: IHelpArticleCreate): Promise<IHelpArticle> {
    return this.post("/api/instances/help/articles/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateArticle(id: string, data: IHelpArticleUpdate): Promise<IHelpArticle> {
    return this.patch(`/api/instances/help/articles/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteArticle(id: string): Promise<void> {
    return this.delete(`/api/instances/help/articles/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async upsertTranslation(
    articleId: string,
    locale: THelpLocale,
    data: IHelpArticleTranslationUpsert
  ): Promise<IHelpArticle> {
    return this.patch(`/api/instances/help/articles/${articleId}/translations/${locale}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Bundle export / import ─────────────────────────────────────────────────

  /** Downloads the full help-center content + images as a .zip bundle. */
  async exportBundle(): Promise<Blob> {
    return this.get("/api/instances/help/export/", {}, { responseType: "blob" })
      .then((res) => res?.data as Blob)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /** Imports a help-center bundle (.zip) into THIS environment, overwriting matching content. */
  async importBundle(file: File): Promise<THelpBundleImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    return this.post("/api/instances/help/import/", formData)
      .then((res) => res?.data as THelpBundleImportResult)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Inline image upload (presigned S3 + completion) ────────────────────────

  private async markAssetUploaded(articleId: string, assetId: string): Promise<void> {
    return this.patch(`/api/instances/help/articles/${articleId}/assets/${assetId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Uploads an inline image for an article and returns the created asset id.
   * The article must already exist (so the asset is never orphaned).
   */
  async uploadArticleImage(articleId: string, file: File): Promise<string> {
    const fileMetaData = await getFileMetaDataForUpload(file);
    return this.post(`/api/instances/help/articles/${articleId}/assets/`, fileMetaData)
      .then(async (response) => {
        const signedURLResponse: TFileSignedURLResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(signedURLResponse.upload_data.url, fileUploadPayload);
        await this.markAssetUploaded(articleId, signedURLResponse.asset_id);
        return signedURLResponse.asset_id;
      })
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
