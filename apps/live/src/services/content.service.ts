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

// services
import { logger } from "@plane/logger";
import { env } from "@/env";
import { AppError } from "@/lib/errors";
import { APIService } from "./api.service";

// Base params interface for content operations
type ContentParams = {
  url: string;
  cookie?: string;
};

export class ContentService extends APIService {
  constructor() {
    super();
  }

  /**
   * Gets the common headers used for requests, similar to BasePageService
   */
  protected getHeaders(params: { cookie?: string }): Record<string, string> {
    const { cookie } = params;
    const headers: Record<string, string> = {};
    const liveServerSecretKey = env.LIVE_SERVER_SECRET_KEY;

    if (cookie) {
      headers.Cookie = cookie;
    }

    if (liveServerSecretKey) {
      headers["live-server-secret-key"] = liveServerSecretKey;
    }

    return headers;
  }

  /**
   * Fetches content from a given URL with proper cookie handling
   */
  async getFileContent(params: ContentParams) {
    const { url, cookie } = params;

    const isPublicAsset = url.includes("/api/public/");
    let fetchUrl: string;
    if (isPublicAsset) {
      fetchUrl = url;
    } else {
      const [path, query] = url.split("?");
      const pathWithServer = path.endsWith("/") ? `${path}server/` : `${path}/server/`;
      fetchUrl = query ? `${pathWithServer}?${query}` : pathWithServer;
    }
    const [base, existingQuery] = fetchUrl.split("?");
    const searchParams = new URLSearchParams(existingQuery ?? "");
    searchParams.set("is_server", "true");
    fetchUrl = `${base}?${searchParams.toString()}`;
    return this.get(fetchUrl, {
      headers: this.getHeaders({ cookie }),
      withCredentials: true,
    })
      .then((response) => response?.data)
      .catch((error) => {
        const appError = new AppError(error, {
          context: { operation: "getFileContent", assetUrl: url },
        });
        logger.error("Failed to fetch file content", appError);
        throw appError;
      });
  }
}

// Create a singleton instance
export const ContentAPI = new ContentService();
