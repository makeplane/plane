import React from "react";
// components
import { EmptyStateType, TEmptyStateType } from "@plane/constants";
import { ISearchIssueResponse } from "@plane/types";
import { EmptyState } from "@/components/empty-state";
// types
// constants

interface EmptyStateProps {
  issues: ISearchIssueResponse[];
  searchTerm: string;
  debouncedSearchTerm: string;
  isSearching: boolean;
}

export const IssueSearchModalEmptyState: React.FC<EmptyStateProps> = ({
  issues,
  searchTerm,
  debouncedSearchTerm,
  isSearching,
}) => {
  const renderEmptyState = (type: TEmptyStateType) => (
    <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
      <EmptyState type={type} layout="screen-simple" />
    </div>
  );

  const emptyState =
    issues.length === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && !isSearching
      ? renderEmptyState(EmptyStateType.ISSUE_RELATION_SEARCH_EMPTY_STATE)
      : issues.length === 0
        ? renderEmptyState(EmptyStateType.ISSUE_RELATION_EMPTY_STATE)
        : null;

  return emptyState;
};
