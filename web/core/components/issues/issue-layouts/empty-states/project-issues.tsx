import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IIssueFilterOptions } from "@plane/types";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
// hooks
import { useCommandPalette, useEventTracker, useIssues } from "@/hooks/store";
// components
import { ResolvedProjectEmptyState } from "@/plane-web/components/issues";

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

  const additionalPath = issueFilterCount > 0 ? (activeLayout ?? "list") : undefined;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <ResolvedProjectEmptyState
        issueFilterCount={issueFilterCount}
        additionalPath={additionalPath}
        handleClearAllFilters={handleClearAllFilters}
        toggleCreateIssueModal={toggleCreateIssueModal}
        setTrackElement={setTrackElement}
        emptyStateType={issueFilterCount > 0 ? EmptyStateType.PROJECT_EMPTY_FILTER : undefined}
      />
    </div>
  );
});
