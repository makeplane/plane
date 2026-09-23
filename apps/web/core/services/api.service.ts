/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { create } from "axios";
import { normalizeAPIRequestURL } from "@plane/services";

export abstract class APIService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = create({
      baseURL,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use((config) => {
      try {
        if (config.url) {
          config.url = normalizeAPIRequestURL(config.url, this.baseURL);
        }
      } catch (error) {
        // Never block a request because of slash normalization — fall back to the
        // original URL and let the call proceed.
        console.warn("[APIService] Failed to normalize trailing slash:", config.url, error);
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const currentPath = window.location.pathname;
          // The entry page ("/") runs its own current-user request on mount;
          // when the session is expired that request 401s too, and redirecting
          // "/" to "/?next_path=/" reloads the page in an endless loop instead of
          // letting the sign-in screen render. Only bounce away from private
          // routes.
          if (currentPath !== "/") {
            window.location.replace(`/${currentPath ? `?next_path=${encodeURIComponent(currentPath)}` : ``}`);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get(url: string, params = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.get(url, {
      ...params,
      ...config,
    });
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
