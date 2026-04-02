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

import { useState, useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { TBitbucketRepository } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import BitbucketLogo from "@/app/assets/services/bitbucket.svg?url";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";
import type { TProjectMap } from "@/types/integrations";

type TSelectBitbucketRepository = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  excludeRepositoryIds?: string[];
};

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;

type TSearchResult = {
  values: TBitbucketRepository[];
  isLastPage: boolean;
  nextPageStart?: number;
};

const dedupeReposById = (repos: TBitbucketRepository[]): TBitbucketRepository[] => {
  const seen = new Set<number>();
  return repos.filter((repo) => {
    if (seen.has(repo.id)) return false;
    seen.add(repo.id);
    return true;
  });
};

export const SelectBitbucketRepository = observer(function SelectBitbucketRepository({
  value,
  handleChange,
  excludeRepositoryIds,
}: TSelectBitbucketRepository) {
  const {
    workspace,
    data: { searchBitbucketRepositories, bitbucketRepositoryById },
  } = useBitbucketDCIntegration();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [additionalPages, setAdditionalPages] = useState<TBitbucketRepository[]>([]);
  const [pageInfo, setPageInfo] = useState<{ nextPageStart?: number; isLastPage: boolean }>({ isLastPage: false });

  const workspaceId = workspace?.id;
  const normalizedQuery = debouncedQuery.trim();

  // Stable key scoped to workspace + query — used to detect stale responses
  const requestKey = workspaceId ? `${workspaceId}:${normalizedQuery}` : null;
  const activeKeyRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);

  // Keep activeKeyRef in sync
  useEffect(() => {
    activeKeyRef.current = requestKey;
  }, [requestKey]);

  // Standard debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset additional pages when request key changes (query or workspace)
  useEffect(() => {
    setAdditionalPages([]);
    setPageInfo({ isLastPage: false });
    loadingMoreRef.current = false;
  }, [requestKey]);

  // SWR owns the first page — pure fetcher, no side effects
  const swrKey = workspaceId ? `BITBUCKET_DC_REPO_SEARCH_${workspaceId}_q=${normalizedQuery}` : null;

  const swrResult = useSWR<TSearchResult | undefined>(
    swrKey,
    async () => {
      const result = await searchBitbucketRepositories({
        search: normalizedQuery || undefined,
        limit: PAGE_SIZE,
        start: 0,
      });
      return result;
    },
    {
      revalidateOnFocus: false,
      errorRetryCount: 1,
      keepPreviousData: true,
      dedupingInterval: 2000,
    }
  );

  const firstPage = swrResult.data;
  const error = swrResult.error as unknown;
  const isLoading = swrResult.isLoading;
  const isValidating = swrResult.isValidating;

  // Derive page-1 cursor from SWR data; use local pageInfo once additional pages are loaded
  const currentNextPageStart = additionalPages.length > 0 ? pageInfo.nextPageStart : firstPage?.nextPageStart;
  const currentIsLastPage = additionalPages.length > 0 ? pageInfo.isLastPage : (firstPage?.isLastPage ?? false);

  // Infinite scroll — guarded against stale responses and double-fires
  const fetchMoreOptions = useCallback(async () => {
    if (!requestKey || currentIsLastPage || currentNextPageStart === undefined || loadingMoreRef.current) return;

    const keyAtStart = requestKey;
    loadingMoreRef.current = true;

    try {
      const result = await searchBitbucketRepositories({
        search: normalizedQuery || undefined,
        limit: PAGE_SIZE,
        start: currentNextPageStart,
      });

      // Discard if query changed while request was in flight
      if (!result || activeKeyRef.current !== keyAtStart) return;

      setAdditionalPages((prev) => dedupeReposById([...prev, ...result.values]));
      setPageInfo({ nextPageStart: result.nextPageStart, isLastPage: result.isLastPage });
    } finally {
      loadingMoreRef.current = false;
    }
  }, [requestKey, normalizedQuery, currentIsLastPage, currentNextPageStart, searchBitbucketRepositories]);

  // Combine first page (SWR) + additional pages (scroll)
  const allRepos = dedupeReposById([...(firstPage?.values ?? []), ...additionalPages]);
  const filteredRepos = excludeRepositoryIds
    ? allRepos.filter((repo) => !excludeRepositoryIds.includes(repo.id.toString()))
    : allRepos;

  // Resolve selected repo from MobX cache so label renders even when not in current results
  const selectedRepo = value?.entityId ? bitbucketRepositoryById(value.entityId) : undefined;

  const hasResults = filteredRepos.length > 0;
  const noResultsMessage = error
    ? "Failed to load repositories"
    : isLoading || (isValidating && !hasResults)
      ? "Searching..."
      : "No repositories found";

  const selectedLabel = selectedRepo ? (
    <div className="relative flex items-center gap-2 truncate">
      <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
        <img src={BitbucketLogo} alt="Bitbucket Logo" className="w-full h-full object-cover" />
      </div>
      <div className="flex-grow truncate line-clamp-1">{`${selectedRepo.project.key}/${selectedRepo.name}`}</div>
    </div>
  ) : (
    "Choose a repository"
  );

  return (
    <>
      <div className="text-body-xs-regular text-secondary">Bitbucket Repository</div>
      <CustomSearchSelect
        label={selectedLabel}
        options={filteredRepos.map((repo) => ({
          value: repo.id.toString(),
          query: `${repo.project.key}/${repo.name}`,
          content: (
            <div className="relative flex items-center gap-2 truncate">
              <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                <img src={BitbucketLogo} alt="Bitbucket Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow truncate line-clamp-1">{`${repo.project.key}/${repo.name}`}</div>
            </div>
          ),
        }))}
        value={value?.entityId ?? undefined}
        onChange={(val: string | undefined) => handleChange("entityId", val)}
        buttonClassName="w-full min-h-8 h-full"
        noChevron
        searchQuery={searchQuery}
        onSearchQueryChange={(query: string) => setSearchQuery(query)}
        fetchMoreOptions={() => void fetchMoreOptions()}
        noResultsMessage={noResultsMessage}
      />
    </>
  );
});
