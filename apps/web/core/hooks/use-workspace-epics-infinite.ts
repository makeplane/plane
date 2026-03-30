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

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";

import type { ISearchIssueResponse, TPaginatedResponse, TWorkspaceEpicsSearchParams } from "@plane/types";

import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

const SWR_KEY_PREFIX = "workspace-epics-modal";
const INITIAL_CURSOR = "20:0:0";

type Params = {
  workspaceSlug?: string;
  isOpen: boolean;
  apiParams: Partial<TWorkspaceEpicsSearchParams>;
};

type SWRKey = [typeof SWR_KEY_PREFIX, string, string | null, Partial<TWorkspaceEpicsSearchParams>];

export function useWorkspaceEpicsInfinite({ workspaceSlug, isOpen, apiParams }: Params) {
  const getKey = useCallback(
    (pageIndex: number, previousPageData: TPaginatedResponse<ISearchIssueResponse[]> | null): SWRKey | null => {
      if (!isOpen || !workspaceSlug) return null;

      if (pageIndex === 0) {
        return [SWR_KEY_PREFIX, workspaceSlug, INITIAL_CURSOR, apiParams];
      }

      if (!previousPageData?.next_page_results) {
        return null;
      }

      return [SWR_KEY_PREFIX, workspaceSlug, previousPageData.next_cursor ?? null, apiParams];
    },
    [workspaceSlug, isOpen, apiParams]
  );

  const fetcher = useCallback(([, workspaceSlug, cursor, params]: SWRKey) => {
    return workspaceService.fetchWorkspaceEpics(workspaceSlug, {
      ...params,
      cursor: cursor ?? INITIAL_CURSOR,
    });
  }, []);

  const { data, setSize, isLoading, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const epics = useMemo<ISearchIssueResponse[]>(() => data?.flatMap((page) => page.results ?? []) ?? [], [data]);

  const hasMore = useMemo(() => {
    if (!data?.length) return false;
    return data[data.length - 1]?.next_page_results ?? false;
  }, [data]);

  const loadMore = useCallback(() => {
    if (!hasMore || isValidating) return;
    setSize((prev) => prev + 1);
  }, [hasMore, isValidating, setSize]);

  return {
    epics,
    hasMore,
    loadMore,
    isLoading,
    isValidating,
  };
}
