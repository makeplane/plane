/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AxiosRequestConfig } from "axios";
import { CancelToken, isCancel } from "axios";
// services
import { APIService } from "@/services/api.service";

export class FileUploadService extends APIService {
  private cancelSource: any;

  constructor() {
    super("");
  }

  async uploadFile(
    url: string,
    data: FormData,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<void> {
    this.cancelSource = CancelToken.source();

    const isPut = data.has("_method") && data.get("_method") === "PUT";
    const requestMethod = isPut ? "put" : "post";
    // For PUT (Cloudflare R2), we send the raw File blob, not FormData. The helper appended it as 'file'
    const requestData = isPut ? data.get("file") : data;

    if (isPut && !(requestData instanceof Blob)) {
      return Promise.reject(new Error("Invalid or missing file data for upload."));
    }

    const contentType = isPut ? data.get("Content-Type") || "application/octet-stream" : "multipart/form-data";

    return this[requestMethod](url, requestData, {
      headers: {
        "Content-Type": contentType as string,
      },
      cancelToken: this.cancelSource.token,
      withCredentials: false,
      onUploadProgress: uploadProgressHandler,
    })
      .then((response) => response?.data)
      .catch((error) => {
        if (isCancel(error)) {
          console.log(error.message);
        } else {
          throw error?.response?.data;
        }
      });
  }

  cancelUpload() {
    this.cancelSource.cancel("Upload canceled");
  }
}
