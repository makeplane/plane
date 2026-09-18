/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AxiosRequestConfig } from "axios";
import axios from "axios";
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
    this.cancelSource = axios.CancelToken.source();
    return this.post(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      cancelToken: this.cancelSource.token,
      withCredentials: false,
      onUploadProgress: uploadProgressHandler,
    })
      .then((response) => response?.data)
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.log(error.message);
          return;
        }
        // A blocked port, an offline client, a CORS failure or an aborted upload
        // never produces a response payload. Rethrowing `undefined` here leaves
        // every caller showing a generic "upload failed" message, so surface the
        // underlying axios reason instead.
        const responseData = error?.response?.data;
        if (responseData !== undefined && responseData !== null) throw responseData;
        throw new Error(error?.message ?? "Upload failed");
      });
  }

  cancelUpload() {
    this.cancelSource.cancel("Upload canceled");
  }
}
