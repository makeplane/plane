import React from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ISearchIssueResponse } from "@plane/types";
// components
import { SimpleEmptyState } from "@/components/empty-state";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

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
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const searchResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/search" });
  const issuesResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/issues" });

  const EmptyStateContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center px-3 py-8 text-center">{children}</div>
  );

  if (issues.length === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && !isSearching) {
    return (
      <EmptyStateContainer>
        <SimpleEmptyState title={t("issue_relation.empty_state.no_issues.title")} assetPath={issuesResolvedPath} />
      </EmptyStateContainer>
    );
  } else if (issues.length === 0) {
    return (
      <EmptyStateContainer>
        <SimpleEmptyState title={t("issue_relation.empty_state.search.title")} assetPath={searchResolvedPath} />
      </EmptyStateContainer>
    );
  }
  return null;
};
