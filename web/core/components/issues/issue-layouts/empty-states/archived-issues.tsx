import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IIssueFilterOptions } from "@plane/types";
// hooks
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
// types

export const ProjectArchivedEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // theme
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

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
    issueFilterCount > 0 ? EmptyStateType.PROJECT_ARCHIVED_EMPTY_FILTER : EmptyStateType.PROJECT_ARCHIVED_NO_ISSUES;
  const additionalPath = issueFilterCount > 0 ? activeLayout ?? "list" : undefined;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState
        type={emptyStateType}
        additionalPath={additionalPath}
        primaryButtonLink={
          issueFilterCount > 0 ? undefined : `/${workspaceSlug}/projects/${projectId}/settings/automations`
        }
        secondaryButtonOnClick={issueFilterCount > 0 ? handleClearAllFilters : undefined}
      />
    </div>
  );
});
