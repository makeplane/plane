import { useEffect, useState, useMemo, useCallback } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, AlertCircle, Loader as Spinner } from "lucide-react";
// plane imports
import {
  TSearchFilterKeys,
  TSearchQueryResponse,
  TSearchResultItem,
  SEARCH_FILTERS,
  ESearchFilterKeys,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@/helpers/common.helper";
// services
import { WorkspaceService } from "@/plane-web/services";
// constants
import { SearchItems } from "./search-item";

const workspaceService = new WorkspaceService();

const DEBOUNCE_DELAY = 900;

type TProps = {
  query: string;
  flattenedSearchResults: TSearchResultItem[];
  isSearching: boolean;
  setFlattenedSearchResults: (results: TSearchResultItem[]) => void;
  setIsSearching: (isSearching: boolean) => void;
};

export const SearchResults: React.FC<TProps> = observer((props) => {
  const { query, flattenedSearchResults, setFlattenedSearchResults, isSearching, setIsSearching } = props;
  // params
  const { workspaceSlug } = useParams();
  // states
  const [searchFilter, setSearchFilter] = useState<TSearchFilterKeys>(ESearchFilterKeys.ALL);
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
    debouncedSearchQuery(query);

    return () => {
      debouncedSearchQuery.cancel();
    };
  }, [query, debouncedSearchQuery, performSearch]);

  const filteredSearchResults = useMemo(() => {
    if (!flattenedSearchResults) return [];
    if (searchFilter === ESearchFilterKeys.ALL) return flattenedSearchResults;
    return searchResults?.[searchFilter] ?? [];
  }, [searchFilter, flattenedSearchResults, searchResults]);

  const getSearchResultsCount = useCallback(
    (filter: TSearchFilterKeys): number => {
      if (!flattenedSearchResults) return 0;
      if (filter === ESearchFilterKeys.ALL) return flattenedSearchResults.length;
      return searchResults?.[filter]?.length ?? 0;
    },
    [flattenedSearchResults, searchResults]
  );

  const renderSearchFilters = () => (
    <div className="flex gap-3 py-3 overflow-auto horizontal-scrollbar scrollbar-xs">
      {SEARCH_FILTERS.map((filter) => (
        <button
          type="button"
          key={filter.key}
          onClick={() => setSearchFilter(filter.key)}
          className={cn("flex w-fit items-center gap-2 text-xs font-medium rounded-md py-1.5 px-3 transition-all", {
            "text-custom-text-200 bg-custom-background-90": searchFilter !== filter.key,
            "hover:bg-custom-background-80": searchFilter !== filter.key && !isSearching,
            "text-custom-primary-300 bg-custom-primary-200/15": searchFilter === filter.key,
            "cursor-not-allowed opacity-60": isSearching,
          })}
          disabled={searchFilter === filter.key || isSearching}
        >
          <span>{t(filter.i18n_label)}</span>
          {isSearching && searchFilter === filter.key ? (
            <Spinner className="size-3.5 animate-spin" />
          ) : (
            <span className={cn("min-w-4 text-center", { "text-custom-text-350": searchFilter !== filter.key })}>
              {getSearchResultsCount(filter.key)}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  const renderSearchResults = () => {
    if (error) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          {t("common.search.error")}
        </div>
      );
    }

    if (!isSearching && filteredSearchResults.length === 0 && query) {
      return (
        <div className="flex flex-col gap-4 items-center justify-center h-full py-8">
          <div className="w-24 h-24 bg-custom-background-90 rounded-full flex items-center justify-center">
            <Search className="w-14 h-14 text-custom-text-400/40" />
          </div>
          <div className="text-center space-y-2">
            <div className="text-xl font-bold text-custom-text-300">{t("common.search.no_results.title")}</div>
            <div className="text-sm text-custom-text-300 max-w-[300px]">
              {t("common.search.no_results.description")}
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* {query.length < MIN_SEARCH_LENGTH && flattenedSearchResults.length === 0 && (
          <div className="text-sm text-custom-text-200 p-3 bg-custom-background-90 rounded-md">
            {t("common.search.min_chars", { count: MIN_SEARCH_LENGTH })}
          </div>
        )} */}
        <div className="flex flex-col transition-all duration-500 fade-in">
          {filteredSearchResults.map((entity) => (
            <Link
              key={entity.id}
              href={SearchItems[entity.entity_type || searchFilter]?.path(entity) ?? "/"}
              className="group rounded-md flex items-center gap-2 p-3 text-sm text-custom-text-100 transition-all duration-300 ease-in-out hover:bg-custom-background-90 hover:px-3"
            >
              <span className="flex-shrink-0">{SearchItems[entity.entity_type || searchFilter]?.icon(entity)}</span>
              <span className="flex-1 line-clamp-2">
                {SearchItems[entity.entity_type || searchFilter]?.itemName(entity)}
              </span>
            </Link>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="w-full h-full flex flex-col py-2">
      {renderSearchFilters()}
      <div className="flex-1 overflow-y-auto">{renderSearchResults()}</div>
    </div>
  );
});
