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

import type { AxiosInstance } from "axios";
import axios from "axios";
// types
import type { ClientOptions } from "@/types/types";

export abstract class APIService {
  private axiosInstance: AxiosInstance;

  constructor(options: ClientOptions) {
    const { baseURL, apiToken, bearerToken } = options;
    const headers = {
      ...(apiToken && { "X-API-Key": apiToken }),
      ...(bearerToken && { Authorization: `Bearer ${bearerToken}` }),
    };
    this.axiosInstance = axios.create({
      baseURL,
      headers,
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          console.log("401 error");
        }
        if (
          error.response.status === 502 ||
          error.response.status === 503 ||
          error.response.status === 504 ||
          error.code === "ECONNRESET"
        ) {
          // Initialize retry count if not present
          const retryCount = (error.config.__retryCount || 0) + 1;
          const maxRetries = 10;

          if (retryCount <= maxRetries) {
            // Add retry count to config for tracking
            error.config.__retryCount = retryCount;
            console.log(`Retrying request (attempt ${retryCount}/${maxRetries})...`);

            // Here we have to wait for retry after 20 seconds
            await new Promise((resolve) => setTimeout(resolve, 20000));
            return this.axiosInstance(error.config);
          } else {
            console.log(`Max retry attempts (${maxRetries}) reached, failing request`);
            return Promise.reject(new Error(`Request failed after ${maxRetries} retry attempts`));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get<T = any>(url: string, config = {}) {
    return this.axiosInstance.get<T>(url, config);
  }

  post<T = any>(url: string, data = {}, config = {}) {
    return this.axiosInstance.post<T>(url, data, config);
  }

  put<T = any>(url: string, data = {}, config = {}) {
    return this.axiosInstance.put<T>(url, data, config);
  }

  patch<T = any>(url: string, data = {}, config = {}) {
    return this.axiosInstance.patch<T>(url, data, config);
  }

  delete<T = any>(url: string, data?: any, config = {}) {
    return this.axiosInstance.delete<T>(url, { data, ...config });
  }

  request<T = any>(config = {}) {
    return this.axiosInstance<T>(config);
  }
}
