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

import { useEffect, useState, useMemo, useCallback } from "react";
import { Command } from "cmdk";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
// plane imports
import type { TSearchQueryResponse, TSearchResultItem } from "@plane/constants";
import { ESearchFilterKeys } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// components
import { PowerKModalCommandItem } from "@/components/power-k/ui/modal/command-item";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { WorkspaceService } from "@/services/workspace.service";
// constants
import { SearchItems } from "./search-item";
import { SearchFilters } from "./search-filters";

const workspaceService = new WorkspaceService();

const DEBOUNCE_DELAY = 900;

type TProps = {
  query: string;
  flattenedSearchResults: TSearchResultItem[];
  handleResultClick?: () => void;
  isAppSearchPage?: boolean;
  isSearching: boolean;
  setFlattenedSearchResults: (results: TSearchResultItem[]) => void;
  setIsSearching: (isSearching: boolean) => void;
};

export const SearchResults = observer(function SearchResults(props: TProps) {
  const {
    query,
    flattenedSearchResults,
    handleResultClick,
    setFlattenedSearchResults,
    isAppSearchPage = false,
    isSearching,
    setIsSearching,
  } = props;
  // params
  const { workspaceSlug } = useParams();
  const router = useAppRouter();
  // states
  const [searchFilter, setSearchFilter] = useState<ESearchFilterKeys>(ESearchFilterKeys.ALL);
  const [searchResults, setSearchResults] = useState<TSearchQueryResponse>();
  const [error, setError] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const flattenSearchResults = useCallback(
    (results: TSearchQueryResponse): TSearchResultItem[] =>
      Object.entries(results).reduce(
        (acc: TSearchResultItem[], [entityType, items]) => [
          ...acc,
          ...items.map((item) => ({ ...item, entity_type: entityType as ESearchFilterKeys })),
        ],
        []
      ),
    []
  );

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!workspaceSlug) return;
      // update searching and error state

      setError(null);
      // perform search
      try {
        const response = await workspaceService.enhancedSearchAcrossWorkspace(workspaceSlug.toString(), {
          search: searchQuery,
          workspace_search: true,
        });
        // flatten results
        const flattened = flattenSearchResults(response.results);
        // update flattened results
        setFlattenedSearchResults(flattened);
        // update search results
        setSearchResults(response.results);
      } catch (err) {
        setError(t("common.search.error"));
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceSlug, flattenSearchResults]
  );

  const debouncedSearchQuery = useMemo(
    () => debounce((q: string) => performSearch(q), DEBOUNCE_DELAY),
    [performSearch]
  );

  useEffect(() => {
    if (!query) {
      setFlattenedSearchResults([]);
      setSearchResults(undefined);
      setIsSearching(false);
      return;
    }
    void debouncedSearchQuery(query);

    return () => {
      debouncedSearchQuery.cancel();
    };
  }, [query, debouncedSearchQuery, performSearch, setFlattenedSearchResults, setIsSearching]);

  const filteredSearchResults = useMemo(() => {
    if (!flattenedSearchResults) return [];
    if (searchFilter === ESearchFilterKeys.ALL) return flattenedSearchResults;
    return searchResults?.[searchFilter] ?? [];
  }, [searchFilter, flattenedSearchResults, searchResults]);

  const renderSearchResults = () => {
    if (error) {
      return (
        <div className="flex items-center gap-2 text-13 text-danger-primary bg-danger-subtle p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          {t("common.search.error")}
        </div>
      );
    }

    if (!isSearching && filteredSearchResults.length === 0 && query) {
      return (
        <div className="flex flex-col gap-4 items-center justify-center h-full py-8">
          <div className="w-24 h-24 bg-layer-1 rounded-full flex items-center justify-center">
            <Search className="w-14 h-14 text-placeholder/40" />
          </div>
          <div className="text-center space-y-2">
            <div className="text-18 font-bold text-tertiary">{t("common.search.no_results.title")}</div>
            <div className="text-13 text-tertiary max-w-[300px]">{t("common.search.no_results.description")}</div>
          </div>
        </div>
      );
    }

    return (
      <Command.Group
        heading={isAppSearchPage ? undefined : "Search results"}
        className={cn("transition-all duration-500 fade-in", {
          "px-0!": isAppSearchPage,
        })}
      >
        {filteredSearchResults.map((entity) => (
          <PowerKModalCommandItem
            key={entity.id}
            value={`${entity.entity_type}-${entity.id}-${entity.name}`}
            iconNode={SearchItems[entity.entity_type || searchFilter]?.icon(entity)}
            label={SearchItems[entity.entity_type || searchFilter]?.itemName({ ...entity, query })}
            onSelect={() => {
              router.push(SearchItems[entity.entity_type || searchFilter]?.path(entity) ?? "/");
              handleResultClick?.();
            }}
          />
        ))}
      </Command.Group>
    );
  };

  return (
    <div className="size-full flex flex-col overflow-hidden">
      <Command.List className="size-full flex flex-col overflow-y-auto vertical-scrollbar scrollbar-sm py-2">
        <SearchFilters
          flattenedSearchResults={flattenedSearchResults}
          isAppSearchPage={isAppSearchPage}
          isSearching={isSearching}
          searchFilter={searchFilter}
          searchResults={searchResults}
          updateSearchFilter={setSearchFilter}
        />
        <div className="shrink-0">
          {!isAppSearchPage && (
            <Command.Group forceMount>
              <PowerKModalCommandItem
                value="navigate-to-search-page"
                icon={SearchIcon}
                label="Go to advanced search page"
                forceMount
                onSelect={() => {
                  router.push(`/${workspaceSlug}/search?q=${query}`);
                  // close the command palette
                  handleResultClick?.();
                }}
              />
            </Command.Group>
          )}
          {renderSearchResults()}
        </div>
      </Command.List>
      {!isAppSearchPage && filteredSearchResults.length !== 0 && (
        <div className="shrink-0 pt-5 pb-2 px-3 flex items-center gap-2">
          <p className="flex items-center gap-1 text-placeholder">
            <span className="shrink-0 size-5 grid place-items-center rounded bg-layer-3 border border-subtle-1">
              <ArrowUp className="size-3" />
            </span>
            <span className="shrink-0 size-5 grid place-items-center rounded bg-layer-3 border border-subtle-1">
              <ArrowDown className="shrink-0 size-3" />
            </span>
            <span className="text-caption-md-medium">Select</span>
          </p>
          <p className="flex items-center gap-1 text-placeholder">
            <span className="shrink-0 h-5 px-1 rounded bg-layer-3 text-11 font-medium flex items-center border border-subtle-1">
              Enter
            </span>
            <span className="text-caption-md-medium">Open</span>
          </p>
        </div>
      )}
    </div>
  );
});
