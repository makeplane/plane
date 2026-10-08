/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { mutate } from "swr";

/** every time tracking SWR key starts with this, followed by the workspace slug */
export const TIME_TRACKING_KEY_PREFIX = "TIME_TRACKING_";

/** JSON with sorted object keys, so equal filters always give the same cache key */
const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return v;
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts a fresh array
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
  });

const key = (workspaceSlug: string, ...parts: unknown[]) =>
  `${TIME_TRACKING_KEY_PREFIX}${workspaceSlug}_${parts.map((part) => (typeof part === "string" ? part : stableStringify(part))).join("_")}`;

export const timeTrackingKeys = {
  entries: (workspaceSlug: string, params: unknown) => key(workspaceSlug, "ENTRIES", params),
  summary: (workspaceSlug: string, filters: unknown) => key(workspaceSlug, "SUMMARY", filters),
  report: (workspaceSlug: string, filters: unknown, params: unknown) => key(workspaceSlug, "REPORT", filters, params),
  timesheet: (workspaceSlug: string, userId: string, weekStartDate: string) =>
    key(workspaceSlug, "TIMESHEET", userId, weekStartDate),
  workItem: (workspaceSlug: string, projectId: string, issueId: string) =>
    key(workspaceSlug, "WORK_ITEM", projectId, issueId),
  issueTotals: (workspaceSlug: string, projectId: string) => key(workspaceSlug, "ISSUE_TOTALS", projectId),
  projectSettings: (workspaceSlug: string, projectId: string) => key(workspaceSlug, "PROJECT_SETTINGS", projectId),
};

// SWR's global mutate(filter) skips useSWRInfinite caches, so paginated lists register their own revalidator
const infiniteRevalidators = new Set<() => unknown>();

export const registerInfiniteRevalidator = (revalidate: () => unknown) => {
  infiniteRevalidators.add(revalidate);
  return () => {
    infiniteRevalidators.delete(revalidate);
  };
};

/**
 * Refetch everything time related in a workspace: lists, totals, reports, timesheets.
 * Call after every write.
 */
export const revalidateTimeTracking = async (workspaceSlug: string) => {
  const prefix = `${TIME_TRACKING_KEY_PREFIX}${workspaceSlug}_`;
  await Promise.all([
    mutate((cacheKey) => typeof cacheKey === "string" && cacheKey.startsWith(prefix)),
    ...Array.from(infiniteRevalidators, (revalidate) => revalidate()),
  ]);
};
