"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { WORKSPACE_DEFAULT_SEARCH_RESULT } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IWorkspaceSearchResults } from "@plane/types";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import useDebounce from "@/hooks/use-debounce";
// plane web imports
import { WorkspaceService } from "@/plane-web/services";
// local imports
import type { TPowerKPageType } from "../../core/types";
import { PowerKModalSearchResults } from "./search-results";
// services init
const workspaceService = new WorkspaceService();

type Props = {
  activePage: TPowerKPageType | null;
  isWorkspaceLevel: boolean;
  searchTerm: string;
  resolvedPath: string;
};

export const PowerKModalSearchMenu: React.FC<Props> = (props) => {
  const { activePage, isWorkspaceLevel, searchTerm, resolvedPath } = props;
  // states
  const [resultsCount, setResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<IWorkspaceSearchResults>(WORKSPACE_DEFAULT_SEARCH_RESULT);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  // navigation
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { toggleCommandPaletteModal } = useCommandPalette();
  // plane hooks
  const { t } = useTranslation();
  // State for delayed loading indicator
  const [showDelayedLoader, setShowDelayedLoader] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;

    setIsLoading(true);

    if (debouncedSearchTerm && !activePage) {
      setIsSearching(true);
      workspaceService
        .searchWorkspace(workspaceSlug.toString(), {
          ...(projectId ? { project_id: projectId.toString() } : {}),
          search: debouncedSearchTerm,
          workspace_search: !projectId ? true : isWorkspaceLevel,
        })
        .then((results) => {
          setResults(results);
          const count = Object.keys(results.results).reduce(
            (accumulator, key) => results.results[key as keyof typeof results.results]?.length + accumulator,
            0
          );
          setResultsCount(count);
        })
        .finally(() => {
          setIsLoading(false);
          setIsSearching(false);
        });
    } else {
      setResults(WORKSPACE_DEFAULT_SEARCH_RESULT);
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, isWorkspaceLevel, projectId, workspaceSlug, activePage]);

  // Only show loader after a delay to prevent flash during quick searches
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isLoading || isSearching) {
      // Only show loader if there's a search term and after 300ms delay
      if (searchTerm.trim() !== "") {
        timeoutId = setTimeout(() => {
          setShowDelayedLoader(true);
        }, 300);
      }
    } else {
      // Immediately hide loader when not loading
      setShowDelayedLoader(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, isSearching, searchTerm]);

  return (
    <>
      {searchTerm.trim() !== "" && (
        <div className="flex items-center justify-between mx-[3px] my-4">
          <h5 className="text-xs text-custom-text-100">
            Search results for{" "}
            <span className="font-medium">
              {'"'}
              {searchTerm}
              {'"'}
            </span>{" "}
            in {isWorkspaceLevel ? "workspace" : "project"}:
          </h5>
          {/* Inline loading indicator - less intrusive */}
          {showDelayedLoader && (
            <div className="flex items-center gap-1.5 text-xs text-custom-text-300">
              <Spinner className="shrink-0 size-3 animate-spin" />
              <span className="animate-pulse">Searching</span>
            </div>
          )}
        </div>
      )}

      {/* Show empty state only when not loading and no results */}
      {!isLoading && resultsCount === 0 && searchTerm.trim() !== "" && debouncedSearchTerm.trim() !== "" && (
        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
          <SimpleEmptyState title={t("command_k.empty_state.search.title")} assetPath={resolvedPath} />
        </div>
      )}

      {!activePage && searchTerm.trim() !== "" && (
        <PowerKModalSearchResults closePalette={() => toggleCommandPaletteModal(false)} results={results} />
      )}
    </>
  );
};
