"use client";

import React, { useState, useEffect } from "react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";

interface ICommandSearchResultsProps {
  searchTerm: string;
  debouncedSearchTerm: string;
  resultsCount: number;
  isLoading: boolean;
  isSearching: boolean;
  projectId: string | undefined;
  isWorkspaceLevel: boolean;
  resolvedPath: string;
  children?: React.ReactNode;
}

export const CommandSearchResults: React.FC<ICommandSearchResultsProps> = (props) => {
  const {
    searchTerm,
    debouncedSearchTerm,
    resultsCount,
    isLoading,
    isSearching,
    projectId,
    isWorkspaceLevel,
    resolvedPath,
    children,
  } = props;
  // plane hooks
  const { t } = useTranslation();

  // State for delayed loading indicator
  const [showDelayedLoader, setShowDelayedLoader] = useState(false);

  // Only show loader after a delay to prevent flash during quick searches
  useEffect(() => {
    let timeoutId: number;

    if (isLoading || isSearching) {
      // Only show loader if there's a search term and after 300ms delay
      if (searchTerm.trim() !== "") {
        timeoutId = window.setTimeout(() => {
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
      {searchTerm !== "" && (
        <div className="flex items-center justify-between mx-[3px] my-4">
          <h5 className="text-xs text-custom-text-100">
            Search results for{" "}
            <span className="font-medium">
              {'"'}
              {searchTerm}
              {'"'}
            </span>{" "}
            in {!projectId || isWorkspaceLevel ? "workspace" : "project"}:
          </h5>
          {/* Inline loading indicator - less intrusive */}
          {showDelayedLoader && (
            <div className="flex items-center gap-1.5 text-xs text-custom-text-300">
              <Spinner className="size-3 animate-spin" />
              <span className="animate-pulse">Searching...</span>
            </div>
          )}
        </div>
      )}

      {/* Show empty state only when not loading and no results */}
      {!isLoading && !isSearching && resultsCount === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && (
        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
          <SimpleEmptyState title={t("command_k.empty_state.search.title")} assetPath={resolvedPath} />
        </div>
      )}

      {children}
    </>
  );
};
