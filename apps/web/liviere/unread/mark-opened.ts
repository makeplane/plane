/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: records that the person opened a work item (peek or full page), which removes it
// from "New". Called from components/issues/peek-overview/root.tsx and the browse/[workItem] page.
// Never throws and never blocks the caller.

import { mutate } from "swr";
import { newWorkItemsService } from "./unread.service";
import { WORK_ITEM_OPENED_EVENT } from "./use-new-work-items";

// Work items already recorded in this tab
const recorded = new Set<string>();

const record = async (workspaceSlug: string, projectId: string, workItemId: string) => {
  try {
    await newWorkItemsService.markOpened(workspaceSlug, projectId, workItemId);
  } catch (error) {
    // 403/404: not allowed or not listed (e.g. archived) – nothing to record. Otherwise retry next time.
    const statusCode = (error as { response?: { status?: number } })?.response?.status;
    if (!statusCode || statusCode >= 500) recorded.delete(workItemId);
    return;
  }
  window.dispatchEvent(new CustomEvent(WORK_ITEM_OPENED_EVENT, { detail: { workItemId } }));
  void mutate((key) => typeof key === "string" && key.startsWith("LIVIERE_NEW_COUNT_"));
};

export const markWorkItemOpened = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  workItemId: string | undefined
) => {
  if (!workspaceSlug || !projectId || !workItemId || recorded.has(workItemId)) return;
  recorded.add(workItemId);
  void record(workspaceSlug, projectId, workItemId);
};
