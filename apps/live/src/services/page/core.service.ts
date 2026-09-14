/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { logger } from "@plane/logger";
import type { TDocumentPayload, TPage } from "@plane/types";
// services
import { AppError } from "@/lib/errors";
import { APIService } from "../api.service";

export abstract class PageCoreService extends APIService {
  protected abstract basePath: string;

  

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

  async updateDescriptionBinary(pageId: string, data: TDocumentPayload): Promise<any> {
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
}
