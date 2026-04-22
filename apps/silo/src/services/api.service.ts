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

import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios, { AxiosHeaders } from "axios";
// types
import { logger } from "@plane/logger";
import { wait } from "@/helpers/delay";
import HMACSigner from "@/helpers/hmac-sign";
import type { ClientOptions } from "@/types";

export abstract class APIService {
  private axiosInstance: AxiosInstance;
  private hmacPrivateKey: string;
  private serviceName: string;

  constructor(options: ClientOptions) {
    const { baseURL, hmacPrivateKey, serviceName } = options;
    this.hmacPrivateKey = hmacPrivateKey;
    this.serviceName = serviceName;
    this.axiosInstance = axios.create({
      baseURL,
      headers: {},
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add HMAC headers
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Create the HMAC signature
        const hmacHeaders = HMACSigner.generateHeaders(
          this.hmacPrivateKey,
          this.serviceName,
          config.method as string,
          config.url as string
        );

        // Add the HMAC headers
        config.headers = new AxiosHeaders({
          ...config.headers,
          ...hmacHeaders,
        });

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const code = error?.code;
        logger.error("[api.service:response-interceptor] axios error", {
          status,
          statusText: error?.response?.statusText,
          code,
          message: error?.message,
          url: error?.config?.url,
          method: error?.config?.method,
          baseURL: error?.config?.baseURL,
          timeout: error?.config?.timeout,
          hasResponse: Boolean(error?.response),
          hasRequest: Boolean(error?.request),
          dataPreview:
            typeof error?.response?.data === "string"
              ? (error.response.data as string).slice(0, 500)
              : (() => {
                  try {
                    return JSON.stringify(error?.response?.data)?.slice(0, 500);
                  } catch {
                    return "<unserializable>";
                  }
                })(),
        });
        if (status === 401) {
          logger.error("401 error");
        }
        if (
          status === 502 ||
          status === 503 ||
          status === 504 ||
          code === "ECONNRESET" ||
          code === "ECONNABORTED" ||
          code === "ETIMEDOUT" ||
          code === "EPIPE"
        ) {
          // Initialize retry count if not present
          const retryCount = (error.config.__retryCount || 0) + 1;
          const maxRetries = 10;

          if (retryCount <= maxRetries) {
            // Add retry count to config for tracking
            error.config.__retryCount = retryCount;
            logger.info(`Retrying request (attempt ${retryCount}/${maxRetries})...`);
            // Here we have to wait for retry after 20 seconds
            await wait(20000);
            return this.axiosInstance(error.config);
          } else {
            logger.error(`Max retry attempts (${maxRetries}) reached, failing request`);
            return Promise.reject(new Error(`Request failed after ${maxRetries} retry attempts`));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get(url: string, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.get(url, config);
  }

  post(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.post(url, data, config);
  }

  put(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  patch(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.patch(url, data, config);
  }

  delete(url: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  request(config = {}) {
    return this.axiosInstance(config);
  }
}
