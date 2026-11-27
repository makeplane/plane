/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: data hooks of the decision register page. The page loads the whole register once and
// filters it in the browser; queue counts, areas, details and the full-text search come separately.

import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { decisionsService, isDisabledError, isForbiddenError } from "./decisions.service";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, localSearchHits } from "./model";
import type { TDecision } from "./types";

export const decisionsEnabledProjectsKey = (workspaceSlug: string) =>
  `LIVIERE_DECISIONS_ENABLED_PROJECTS_${workspaceSlug}`;
export const decisionSettingsKey = (projectId: string) => `LIVIERE_DECISIONS_SETTINGS_${projectId}`;
// Every key of a project's register data starts with this (not the settings: they decide whether to load it)
const dataKey = (projectId: string, part: string) => `LIVIERE_DECISIONS_${projectId}_${part}`;

// Neither a refused nor a turned-off register gets better by asking again
const retryUnlessRefused = {
  revalidateOnFocus: false,
  shouldRetryOnError: (error: unknown) => !isForbiddenError(error) && !isDisabledError(error),
};

export const useDecisionsEnabledProjects = (workspaceSlug: string | undefined) =>
  useSWR(
    workspaceSlug ? decisionsEnabledProjectsKey(workspaceSlug) : null,
    workspaceSlug ? () => decisionsService.getEnabledProjectIds(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

/**
 * Settings of the register; only fetched for project admins and members (`canRead`). Asked again when the tab
 * gets the focus back, so a register turned off in another tab shows as such without waiting for a change.
 */
export const useDecisionSettings = (workspaceSlug: string | undefined, projectId: string | undefined, canRead = true) =>
  useSWR(
    workspaceSlug && projectId && canRead ? decisionSettingsKey(projectId) : null,
    workspaceSlug && projectId ? () => decisionsService.getSettings(workspaceSlug, projectId) : null,
    { ...retryUnlessRefused, revalidateOnFocus: true }
  );

export const useDecisionList = (workspaceSlug: string, projectId: string, enabled: boolean) =>
  useSWR(enabled ? dataKey(projectId, "LIST") : null, () => decisionsService.listAll(workspaceSlug, projectId), {
    ...retryUnlessRefused,
    keepPreviousData: true,
  });

export const useDecisionAreas = (workspaceSlug: string, projectId: string, enabled: boolean) =>
  useSWR(enabled ? dataKey(projectId, "AREAS") : null, () => decisionsService.getAreas(workspaceSlug, projectId), {
    ...retryUnlessRefused,
    keepPreviousData: true,
  });

export const useDecisionQueues = (workspaceSlug: string, projectId: string, enabled: boolean) =>
  useSWR(enabled ? dataKey(projectId, "QUEUES") : null, () => decisionsService.getQueues(workspaceSlug, projectId), {
    ...retryUnlessRefused,
    keepPreviousData: true,
  });

/** Details (history, chain) of one decision, loaded when its card opens. */
export const useDecisionDetail = (workspaceSlug: string, projectId: string, number: number | null) =>
  useSWR(
    number !== null ? dataKey(projectId, `DETAIL_${number}`) : null,
    number !== null ? () => decisionsService.getDecision(workspaceSlug, projectId, number) : null,
    retryUnlessRefused
  );

// Wait this long after the last keystroke before asking the API
export const SEARCH_DEBOUNCE_MS = 300;

export type TDecisionSearch = {
  // null: no search (empty phrase); otherwise the numbers found (full-text search plus number/work item)
  hits: Set<number> | null;
  // The phrase is shorter than the API takes; only the number/work item match applies
  tooShort: boolean;
  loading: boolean;
  // The API found more than the limit
  hasMore: boolean;
  error: boolean;
};

/** Search of the register: full text through the API (debounced) plus number and work item in the browser. */
export function useDecisionSearch(
  workspaceSlug: string,
  projectId: string,
  phrase: string,
  decisions: TDecision[]
): TDecisionSearch {
  const trimmed = phrase.trim().slice(0, SEARCH_MAX_LENGTH);
  const [debounced, setDebounced] = useState(trimmed);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);
  const tooShort = trimmed.length > 0 && trimmed.length < SEARCH_MIN_LENGTH;
  const asksApi = debounced.length >= SEARCH_MIN_LENGTH;
  // The phrase stays in memory (SWR key), never in the URL
  const { data, error, isLoading } = useSWR(
    asksApi ? [dataKey(projectId, "SEARCH"), debounced] : null,
    () => decisionsService.search(workspaceSlug, projectId, debounced),
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  const local = useMemo(() => localSearchHits(decisions, trimmed), [decisions, trimmed]);
  const hits = useMemo(() => {
    if (!trimmed) return null;
    const found = new Set(local);
    if (asksApi && debounced === trimmed) for (const decision of data?.results ?? []) found.add(decision.number);
    return found;
  }, [trimmed, local, asksApi, debounced, data]);
  return {
    hits,
    tooShort,
    loading: !!trimmed && trimmed.length >= SEARCH_MIN_LENGTH && (debounced !== trimmed || isLoading),
    hasMore: !!data?.has_more && debounced === trimmed,
    error: !!error,
  };
}

/** Reloads the list, the queue counts, the areas, open details and the search of a project after a change. */
export const refreshDecisions = (projectId: string) =>
  mutate((key) => {
    const value = Array.isArray(key) ? key[0] : key;
    return typeof value === "string" && value.startsWith(`LIVIERE_DECISIONS_${projectId}_`);
  });
