/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@plane/constants";
import { getFileMetaDataForUpload, generateFileUploadPayload } from "@plane/services";
import type { TInitiativeAttachment, TInitiativeAttachmentUploadResponse } from "@plane/types";
import { APIService } from "@/services/api.service";

import { FileUploadService } from "@/services/file-upload.service";

export class InitiativeAttachmentService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  private async updateInitiativeAttachmentUploadStatus(
    workspaceSlug: string,
    initiativeId: string,
    assetId: string
  ): Promise<TInitiativeAttachment> {
    return this.patch(
      `/api/assets/v2/workspaces/${workspaceSlug}/initiatives/${initiativeId}/attachments/${assetId}/`,
      {
        status: "uploaded",
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getInitiativeAttachments(workspaceSlug: string, initiativeId: string): Promise<TInitiativeAttachment[]> {
    return this.get(`/api/assets/v2/workspaces/${workspaceSlug}/initiatives/${initiativeId}/attachments/`)
      .then((response) => response?.data)
      .catch((error) => {
        // Handle error appropriately
        console.error("Error fetching initiative attachments:", error);
        throw error;
      });
  }

  async uploadInitiativeAttachment(
    workspaceSlug: string,
    initiativeId: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<TInitiativeAttachment> {
    const fileMetaData = await getFileMetaDataForUpload(file);
    return this.post(
      `/api/assets/v2/workspaces/${workspaceSlug}/initiatives/${initiativeId}/attachments/`,
      fileMetaData
    )
      .then(async (response) => {
        const signedURLResponse: TInitiativeAttachmentUploadResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(
          signedURLResponse.upload_data.url,
          fileUploadPayload,
          uploadProgressHandler
        );
        await this.updateInitiativeAttachmentUploadStatus(workspaceSlug, initiativeId, signedURLResponse.asset_id);
        return signedURLResponse.attachment;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteInitiativeAttachment(
    workspaceSlug: string,
    initiativeId: string,
    assetId: string
  ): Promise<TInitiativeAttachment> {
    return this.delete(`/api/assets/v2/workspaces/${workspaceSlug}/initiatives/${initiativeId}/attachments/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
