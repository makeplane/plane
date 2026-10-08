/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { TIME_ENTRIES_PER_PAGE } from "@plane/constants";
import type { TTimeEntry, TTimeEntryFilters } from "@plane/types";
// services
import type { TTimeEntryListResponse } from "@/services/time-tracking.service";
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { registerInfiniteRevalidator, timeTrackingKeys } from "./keys";

type TUseTimeEntriesOptions = {
  perPage?: number;
  includeRunning?: boolean;
};

/** Cursor-paginated time entries for a set of filters ("Load more" fetches the next page). */
export const useTimeEntries = (
  workspaceSlug: string | undefined,
  filters: TTimeEntryFilters | null,
  { perPage = TIME_ENTRIES_PER_PAGE, includeRunning = true }: TUseTimeEntriesOptions = {}
) => {
  const baseKey =
    workspaceSlug && filters
      ? timeTrackingKeys.entries(workspaceSlug, { ...filters, include_running: includeRunning, per_page: perPage })
      : null;

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<TTimeEntryListResponse>(
    (pageIndex, previousPage: TTimeEntryListResponse | null) => {
      if (!baseKey) return null;
      if (previousPage && !previousPage.next_page_results) return null;
      return [baseKey, pageIndex === 0 ? `${perPage}:0:0` : previousPage?.next_cursor];
    },
    ([, cursor]: [string, string]) =>
      timeTrackingService.listEntries(workspaceSlug as string, {
        ...(filters as TTimeEntryFilters),
        include_running: includeRunning,
        per_page: perPage,
        cursor,
      }),
    { revalidateOnFocus: false, revalidateFirstPage: false, keepPreviousData: true }
  );

  useEffect(() => registerInfiniteRevalidator(() => mutate()), [mutate]);

  const entries = useMemo<TTimeEntry[]>(() => (data ?? []).flatMap((page) => page.results), [data]);
  const lastPage = data?.[data.length - 1];
  const hasMore = !!lastPage?.next_page_results;
  const isLoadingMore = isValidating && !!data && size > data.length;

  return {
    entries,
    totalCount: data?.[0]?.total_results,
    error,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore: () => setSize(size + 1),
    mutate,
  };
};
