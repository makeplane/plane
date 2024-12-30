import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { EIssueFilterType, EIssuesStoreType } from "@plane/constants";
import { IIssueFilterOptions } from "@plane/types";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette, useEventTracker, useIssues } from "@/hooks/store";

export const ProjectEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();

  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

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

  const emptyStateType = issueFilterCount > 0 ? EmptyStateType.PROJECT_EMPTY_FILTER : EmptyStateType.PROJECT_NO_ISSUES;
  const additionalPath = issueFilterCount > 0 ? activeLayout ?? "list" : undefined;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState
        type={emptyStateType}
        additionalPath={additionalPath}
        primaryButtonOnClick={
          issueFilterCount > 0
            ? undefined
            : () => {
                setTrackElement("Project issue empty state");
                toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              }
        }
        secondaryButtonOnClick={issueFilterCount > 0 ? handleClearAllFilters : undefined}
      />
    </div>
  );
});
