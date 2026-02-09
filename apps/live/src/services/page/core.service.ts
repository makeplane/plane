/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { logger } from "@plane/logger";
import type { TPage } from "@plane/types";
// services
import { AppError } from "@/lib/errors";
import { APIService } from "../api.service";

export type TPageDescriptionPayload = {
  description_binary: string;
  description_html: string;
  description_json: object;
};

export type TUserMention = {
  id: string;
  display_name: string;
  avatar_url?: string;
};

export abstract class PageCoreService extends APIService {
  protected abstract basePath: string;

  constructor() {
    super();
  }

  async fetchDetails(pageId: string): Promise<TPage> {
    try {
      const response = await this.get(`${this.basePath}/pages/${pageId}/`, {
        headers: this.getHeader(),
      });
      return response?.data as TPage;
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchDetails", pageId },
      });
      logger.error("Failed to fetch page details", appError);
      throw appError;
    }
  }

  async fetchDescriptionBinary(pageId: string): Promise<Buffer> {
    try {
      const response = await this.get(`${this.basePath}/pages/${pageId}/description/`, {
        headers: {
          ...this.getHeader(),
          "Content-Type": "application/octet-stream",
        },
        responseType: "arraybuffer",
      });
      const data = response?.data;
      if (!Buffer.isBuffer(data)) {
        throw new Error("Expected response to be a Buffer");
      }
      return data;
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchDescriptionBinary", pageId },
      });
      logger.error("Failed to fetch page description binary", appError);
      throw appError;
    }
  }

  /**
   * Updates the title of a page
   */
  async updatePageProperties(
    pageId: string,
    params: { data: Partial<TPage>; abortSignal?: AbortSignal }
  ): Promise<TPage> {
    const { data, abortSignal } = params;

    // Early abort check
    if (abortSignal?.aborted) {
      throw new AppError(new DOMException("Aborted", "AbortError"));
    }

    // Create an abort listener that will reject the pending promise
    let abortListener: (() => void) | undefined;
    const abortPromise = new Promise((_, reject) => {
      if (abortSignal) {
        abortListener = () => {
          reject(new AppError(new DOMException("Aborted", "AbortError")));
        };
        abortSignal.addEventListener("abort", abortListener);
      }
    });

    try {
      return await Promise.race([
        this.patch(`${this.basePath}/pages/${pageId}/`, data, {
          headers: this.getHeader(),
          signal: abortSignal,
        })
          .then((response) => response?.data)
          .catch((error) => {
            const appError = new AppError(error, {
              context: { operation: "updatePageProperties", pageId },
            });

            if (appError.code === "ABORT_ERROR") {
              throw appError;
            }

            logger.error("Failed to update page properties", appError);
            throw appError;
          }),
        abortPromise,
      ]);
    } finally {
      // Clean up abort listener
      if (abortSignal && abortListener) {
        abortSignal.removeEventListener("abort", abortListener);
      }
    }
  }

  async updateDescriptionBinary(pageId: string, data: TPageDescriptionPayload): Promise<any> {
    try {
      const response = await this.patch(`${this.basePath}/pages/${pageId}/description/`, data, {
        headers: this.getHeader(),
      });
      return response?.data as unknown;
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "updateDescriptionBinary", pageId },
      });
      logger.error("Failed to update page description binary", appError);
      throw appError;
    }
  }

  /**
   * Fetches user mentions for a page
   * @param pageId - The page ID
   * @returns Array of user mentions
   */
  async fetchUserMentions(pageId: string): Promise<TUserMention[]> {
    try {
      const response = await this.get(`${this.basePath}/pages/${pageId}/mentions/`, {
        headers: this.getHeader(),
        params: {
          mention_type: "user_mention",
        },
      });
      return (response?.data as TUserMention[]) ?? [];
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchUserMentions", pageId },
      });
      logger.error("Failed to fetch user mentions", appError);
      throw appError;
    }
  }

  /**
   * Resolves an image asset ID to its actual URL by following the 302 redirect
   * @param workspaceSlug - The workspace slug
   * @param assetId - The asset UUID
   * @param projectId - Optional project ID for project-specific assets
   * @returns The resolved image URL (presigned S3 URL)
   */
  async resolveImageAssetUrl(
    workspaceSlug: string,
    assetId: string,
    projectId?: string | null
  ): Promise<string | null> {
    const path = projectId
      ? `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/?disposition=inline`
      : `/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/?disposition=inline`;

    try {
      const response = await this.get(path, {
        headers: this.getHeader(),
        maxRedirects: 0,
        validateStatus: (status: number) => status >= 200 && status < 400,
      });
      // If we get a 302, the Location header contains the presigned URL
      if (response.status === 302 || response.status === 301) {
        return response.headers?.location || null;
      }
      return null;
    } catch (error) {
      // Axios throws on 3xx when maxRedirects is 0, so we need to handle the redirect from the error
      if ((error as any).response?.status === 302 || (error as any).response?.status === 301) {
        return (error as any).response.headers?.location || null;
      }
      logger.error("Failed to resolve image asset URL", {
        assetId,
        workspaceSlug,
        error: (error as any).message,
      });
      return null;
    }
  }

  /**
   * Resolves multiple image asset IDs to their actual URLs
   * @param workspaceSlug - The workspace slug
   * @param assetIds - Array of asset UUIDs
   * @param projectId - Optional project ID for project-specific assets
   * @returns Map of assetId to resolved URL
   */
  async resolveImageAssetUrls(
    workspaceSlug: string,
    assetIds: string[],
    projectId?: string | null
  ): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    // Resolve all asset URLs in parallel
    const results = await Promise.allSettled(
      assetIds.map(async (assetId) => {
        const url = await this.resolveImageAssetUrl(workspaceSlug, assetId, projectId);
        return { assetId, url };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.url) {
        urlMap.set(result.value.assetId, result.value.url);
      }
    }

    return urlMap;
  }
}
