/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { TimeTrackingService } from "@plane/services";
import type { TTimeEntryPayload, TTimerStartPayload } from "@plane/types";

const timeTrackingService = new TimeTrackingService();

// A week of one user's entries is far below this; it is also the API's page-size ceiling.
const ENTRIES_PER_PAGE = 200;

type Params = {
  workspaceSlug: string;
  userId: string | undefined;
  /** Inclusive local-day range, `YYYY-MM-DD`. */
  from: string;
  to: string;
};

/** Server state for the time tracking page: the running timer, a range of entries and its summary. */
export const useTimeTracking = ({ workspaceSlug, userId, from, to }: Params) => {
  const timerKey = `TEAM_OPS_TIMER_${workspaceSlug}`;
  const rangeKey = userId ? `${workspaceSlug}_${userId}_${from}_${to}` : null;

  const {
    data: timer,
    isLoading: isTimerLoading,
    mutate: mutateTimer,
  } = useSWR(timerKey, () => timeTrackingService.getTimer(workspaceSlug));

  const {
    data: entries,
    isLoading: isEntriesLoading,
    error: entriesError,
    mutate: mutateEntries,
  } = useSWR(rangeKey && `TEAM_OPS_ENTRIES_${rangeKey}`, () =>
    timeTrackingService.listEntries(workspaceSlug, { user: userId, from, to, per_page: ENTRIES_PER_PAGE })
  );

  const { data: summary, mutate: mutateSummary } = useSWR(rangeKey && `TEAM_OPS_SUMMARY_${rangeKey}`, () =>
    timeTrackingService.getSummary(workspaceSlug, { user: userId, from, to })
  );

  const refreshRange = useCallback(
    () => Promise.all([mutateEntries(), mutateSummary()]),
    [mutateEntries, mutateSummary]
  );

  const startTimer = useCallback(
    async (payload: TTimerStartPayload) => {
      const started = await timeTrackingService.startTimer(workspaceSlug, payload);
      await mutateTimer(started, { revalidate: false });
      return started;
    },
    [workspaceSlug, mutateTimer]
  );

  const stopTimer = useCallback(async () => {
    const result = await timeTrackingService.stopTimer(workspaceSlug);
    await mutateTimer(null, { revalidate: false });
    await refreshRange();
    return result;
  }, [workspaceSlug, mutateTimer, refreshRange]);

  const createEntry = useCallback(
    async (payload: TTimeEntryPayload) => {
      const entry = await timeTrackingService.createEntry(workspaceSlug, payload);
      await refreshRange();
      return entry;
    },
    [workspaceSlug, refreshRange]
  );

  const updateEntry = useCallback(
    async (entryId: string, payload: TTimeEntryPayload) => {
      const entry = await timeTrackingService.updateEntry(workspaceSlug, entryId, payload);
      await refreshRange();
      return entry;
    },
    [workspaceSlug, refreshRange]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      await timeTrackingService.deleteEntry(workspaceSlug, entryId);
      await refreshRange();
    },
    [workspaceSlug, refreshRange]
  );

  return {
    timer: timer ?? null,
    isTimerLoading,
    entries: entries?.results ?? [],
    isEntriesLoading,
    entriesError,
    summary,
    startTimer,
    stopTimer,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};
