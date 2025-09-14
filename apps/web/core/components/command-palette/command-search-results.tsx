"use client";

import React from "react";
import { Command } from "cmdk";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
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

  return (
    <>
      {searchTerm !== "" && (
        <h5 className="mx-[3px] my-4 text-xs text-custom-text-100">
          Search results for{" "}
          <span className="font-medium">
            {'"'}
            {searchTerm}
            {'"'}
          </span>{" "}
          in {!projectId || isWorkspaceLevel ? "workspace" : "project"}:
        </h5>
      )}

      {!isLoading && resultsCount === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && (
        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
          <SimpleEmptyState title={t("command_k.empty_state.search.title")} assetPath={resolvedPath} />
        </div>
      )}

      {(isLoading || isSearching) && (
        <Command.Loading>
          <Loader className="space-y-3">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        </Command.Loading>
      )}

      {children}
    </>
  );
};
