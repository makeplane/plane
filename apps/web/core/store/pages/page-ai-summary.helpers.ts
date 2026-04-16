/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { runInAction } from "mobx";
import type { PiChatService } from "@/services/pi-chat.service";

export type PageAiSummaryMap = Map<string, { summary: string | undefined; updated_at: string }>;

export type PageAiSummaryCallbacks = {
  onComplete?: () => void;
  onError?: (error: { code: string; message: string }) => void;
};

export type CreatePageAiSummaryActionsParams = {
  piChatService: PiChatService;
  pageAiSummary: PageAiSummaryMap;
  entityType: "page" | "wiki";
};

export function createPageAiSummaryActions({
  piChatService,
  pageAiSummary,
  entityType,
}: CreatePageAiSummaryActionsParams) {
  const fetchPageAiSummary = async (pageId: string): Promise<string | undefined> => {
    try {
      const response = await piChatService.fetchPageSummary(pageId);
      runInAction(() => {
        pageAiSummary.set(pageId, { summary: response.summary, updated_at: response.generated_at });
      });
      return response.summary;
    } catch (error) {
      console.error("Failed to fetch page AI summary", error);
      return undefined;
    }
  };

  const generatePageAiSummary = (
    pageId: string,
    workspaceId: string,
    callbacks?: PageAiSummaryCallbacks
  ): (() => void) | undefined => {
    if (!workspaceId || !pageId) return;

    runInAction(() => {
      pageAiSummary.set(pageId, { summary: "", updated_at: new Date().toISOString() });
    });

    const abort = piChatService.generatePageSummary(
      {
        page_id: pageId,
        entity_type: entityType,
        workspace_id: workspaceId,
      },
      {
        onChunk: (chunk: string) => {
          runInAction(() => {
            const current = pageAiSummary.get(pageId)?.summary ?? "";
            pageAiSummary.set(pageId, { summary: current + chunk, updated_at: new Date().toISOString() });
          });
        },
        onComplete: () => {
          callbacks?.onComplete?.();
        },
        onError: (error) => {
          console.error("Failed to fetch page AI summary", error);
          runInAction(() => {
            pageAiSummary.delete(pageId);
          });
          callbacks?.onError?.(error);
        },
      }
    );

    return abort;
  };

  const removePageAiSummary = async (pageId: string): Promise<void> => {
    try {
      await piChatService.destroyPageSummary(pageId);
      runInAction(() => {
        pageAiSummary.delete(pageId);
      });
    } catch (error) {
      console.error("Failed to remove page AI summary", error);
    }
  };

  return { fetchPageAiSummary, generatePageAiSummary, removePageAiSummary };
}
