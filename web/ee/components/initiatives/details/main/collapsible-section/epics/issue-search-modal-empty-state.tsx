"use client";

import { FC } from "react";
// components
import { ISearchIssueResponse } from "@plane/types";
import { EmptyState } from "@/components/empty-state";
// types
import { EmptyStateType } from "@/constants/empty-state";
// constants

type Props = {
  issues: ISearchIssueResponse[];
  searchTerm: string;
  debouncedSearchTerm: string;
  isSearching: boolean;
};

export const EpicSearchModalEmptyState: FC<Props> = ({ issues, searchTerm, debouncedSearchTerm, isSearching }) => {
  const renderEmptyState = (type: EmptyStateType) => (
    <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
      <EmptyState type={type} layout="screen-simple" />
    </div>
  );

  const emptyState =
    issues.length === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && !isSearching
      ? renderEmptyState(EmptyStateType.EPIC_RELATION_SEARCH_EMPTY_STATE)
      : issues.length === 0
        ? renderEmptyState(EmptyStateType.EPIC_RELATION_EMPTY_STATE)
        : null;

  return emptyState;
};
