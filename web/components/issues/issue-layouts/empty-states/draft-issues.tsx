import size from "lodash/size";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IIssueFilterOptions } from "@plane/types";
// hooks
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
// types

export const ProjectDraftEmptyState: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.DRAFT);

  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    issuesFilter.updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
      ...newFilters,
    });
  };

  const emptyStateType =
    issueFilterCount > 0 ? EmptyStateType.PROJECT_DRAFT_EMPTY_FILTER : EmptyStateType.PROJECT_DRAFT_NO_ISSUES;
  const additionalPath = issueFilterCount > 0 ? activeLayout ?? "list" : undefined;
  const emptyStateSize = issueFilterCount > 0 ? "lg" : "sm";

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState
        type={emptyStateType}
        additionalPath={additionalPath}
        size={emptyStateSize}
        secondaryButtonOnClick={issueFilterCount > 0 ? handleClearAllFilters : undefined}
      />
    </div>
  );
});
