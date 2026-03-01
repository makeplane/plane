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

import { useCallback } from "react";
import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import type { TSearchQueryResponse, TSearchResultItem } from "@plane/constants";
import { SEARCH_FILTERS, ESearchFilterKeys } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type TProps = {
  flattenedSearchResults: TSearchResultItem[];
  isAppSearchPage: boolean;
  isSearching: boolean;
  searchFilter: ESearchFilterKeys;
  searchResults: TSearchQueryResponse | undefined;
  updateSearchFilter: (filter: ESearchFilterKeys) => void;
};

export const SearchFilters = observer(function SearchResults(props: TProps) {
  const { flattenedSearchResults, isAppSearchPage, isSearching, searchFilter, searchResults, updateSearchFilter } =
    props;
  // plane hooks
  const { t } = useTranslation();

  const getSearchResultsCount = useCallback(
    (filter: ESearchFilterKeys): number => {
      if (!flattenedSearchResults) return 0;
      if (filter === ESearchFilterKeys.ALL) return flattenedSearchResults.length;
      return searchResults?.[filter]?.length ?? 0;
    },
    [flattenedSearchResults, searchResults]
  );

  return (
    <div
      className={cn("shrink-0 flex gap-3 overflow-auto horizontal-scrollbar scrollbar-xs", {
        "px-3": !isAppSearchPage,
      })}
    >
      {SEARCH_FILTERS.map((filter) => (
        <button
          type="button"
          key={filter.key}
          onClick={() => updateSearchFilter(filter.key)}
          className={cn(
            "shrink-0 flex w-fit items-center gap-2 text-11 font-medium rounded-md py-1.5 px-3 transition-all",
            {
              "text-secondary bg-layer-1": searchFilter !== filter.key,
              "hover:bg-layer-1-hover": searchFilter !== filter.key && !isSearching,
              "text-accent-primary bg-accent-subtle": searchFilter === filter.key,
              "cursor-not-allowed opacity-60": isSearching,
            }
          )}
          disabled={searchFilter === filter.key || isSearching}
        >
          <span className="text-nowrap">{t(filter.i18n_label)}</span>
          {isSearching && searchFilter === filter.key ? (
            <Spinner className="size-3.5 animate-spin" />
          ) : getSearchResultsCount(filter.key) > 0 ? (
            <span className={cn("min-w-4 text-center", { "text-tertiary": searchFilter !== filter.key })}>
              {getSearchResultsCount(filter.key)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
});
