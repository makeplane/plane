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

import axios from "axios";
import { LIVE_URL } from "@plane/constants";
import type { IframelyResponse, TVersionDiffResponse } from "@plane/types";
import { APIService } from "@/services/api.service";

export type TPageType = "project" | "workspace" | "teamspace";

export type TVersionDiffParams = {
  pageId: string;
  versionId: string;
  previousVersionId?: string;
  workspaceSlug: string;
  userId: string;
  pageType: TPageType;
  projectId?: string;
  teamspaceId?: string;
};

export type TPdfExportStage =
  | "queued"
  | "fetching-content"
  | "processing-images"
  | "rendering-pdf"
  | "complete"
  | "failed";

export type TPdfExportProgress = {
  stage: TPdfExportStage;
  progress: number;
  message: string;
};

export type TPdfExportCallbacks = {
  onProgress?: (progress: TPdfExportProgress) => void;
  onComplete?: (blob: Blob, fileName: string) => void;
  onError?: (error: { code: string; message: string }) => void;
};

export class LiveService extends APIService {
  constructor() {
    super(LIVE_URL);
  }

  /**
   * Fetches embed data for a URL from the iframely service
   */
  async getEmbedData(
    url: string,
    isDarkTheme: boolean = false,
    workspaceSlug: string,
    userId: string
  ): Promise<IframelyResponse> {
    const response = await this.get(
      `/iframely`,
      {
        params: {
          url: url,
          _theme: isDarkTheme ? "dark" : "light",
          workspaceSlug,
          userId,
        },
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  async getContent(url: string): Promise<string> {
    const response = await this.get(`/content`, {
      params: { url: url },
    });
    return response.data.content;
  }

  /**
   * Starts a PDF export via a single POST-based SSE stream.
   * Returns an abort function to cancel the export.
   */
  exportToPdfWithProgress(
    params: {
      pageId: string;
      workspaceSlug: string;
      projectId?: string;
      teamspaceId?: string;
      title?: string;
      pageSize?: "A4" | "A3" | "A2" | "LETTER" | "LEGAL" | "TABLOID";
      pageOrientation?: "portrait" | "landscape";
      fileName?: string;
      noAssets?: boolean;
    },
    callbacks: TPdfExportCallbacks
  ): () => void {
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    const run = async () => {
      const response = await this.post("/pdf-export", params, {
        responseType: "stream",
        adapter: "fetch",
        signal: controller.signal,
      });

      const stream = response.data as ReadableStream<Uint8Array>;

      if (!stream) {
        callbacks.onError?.({ code: "NO_BODY", message: "Response body is empty" });
        return;
      }

      reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";

        for (const message of messages) {
          if (message.startsWith(":")) continue;

          let eventType = "message";
          let data = "";

          for (const line of message.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7);
            else if (line.startsWith("data: ")) data = line.slice(6);
          }

          if (!data) continue;

          if (eventType === "progress") {
            const progress = JSON.parse(data) as TPdfExportProgress;
            callbacks.onProgress?.(progress);
          } else if (eventType === "complete") {
            const { fileName, data: base64Data } = JSON.parse(data) as { fileName: string; data: string };
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "application/pdf" });
            callbacks.onComplete?.(blob, fileName);
          } else if (eventType === "error") {
            const error = JSON.parse(data) as { code: string; message: string };
            callbacks.onError?.(error);
          }
        }
      }
    };

    run().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (axios.isAxiosError(err) && err.response) {
        const text = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data);
        let parsed: { code: string; message: string };
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { code: "HTTP_ERROR", message: text || `HTTP ${err.response.status}` };
        }
        callbacks.onError?.(parsed);
        return;
      }
      callbacks.onError?.({
        code: "CONNECTION_ERROR",
        message: err instanceof Error ? err.message : "Lost connection to export service",
      });
    });

    return () => {
      reader?.cancel();
      controller.abort();
    };
  }

  /**
   * Fetches precomputed version diff from live server
   * Returns diff data ready for rendering + editors list
   */
  async getVersionDiff(params: TVersionDiffParams): Promise<TVersionDiffResponse> {
    const response = await this.get(
      `/version-diff`,
      {
        params,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
}

// Create a singleton instance
export const liveService = new LiveService();
