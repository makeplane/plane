/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: data hooks of "New" work items.

import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { newWorkItemsService } from "./unread.service";

// Fired on window when a work item was marked as opened in this tab (detail: { workItemId })
export const WORK_ITEM_OPENED_EVENT = "liviere:work-item-opened";
// Fired on window when the list should reload (mark all as read, a push notification arrived)
export const NEW_WORK_ITEMS_CHANGED_EVENT = "liviere:new-work-items-changed";

export const newWorkItemsCountKey = (workspaceSlug: string) => `LIVIERE_NEW_COUNT_${workspaceSlug}`;

export const useNewWorkItemsCount = (workspaceSlug: string | undefined) =>
  useSWR(
    workspaceSlug ? newWorkItemsCountKey(workspaceSlug) : null,
    workspaceSlug ? () => newWorkItemsService.count(workspaceSlug) : null,
    { refreshInterval: 60_000, revalidateOnFocus: true, keepPreviousData: true }
  );

/** Reloads the counter of every workspace and tells open lists to reload. */
export const refreshNewWorkItems = () => {
  void mutate((key) => typeof key === "string" && key.startsWith("LIVIERE_NEW_COUNT_"));
  window.dispatchEvent(new Event(NEW_WORK_ITEMS_CHANGED_EVENT));
};

/** Calls `onChange` when the list should reload. */
export const useNewWorkItemsChanged = (onChange: () => void) => {
  useEffect(() => {
    window.addEventListener(NEW_WORK_ITEMS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(NEW_WORK_ITEMS_CHANGED_EVENT, onChange);
  }, [onChange]);
};
