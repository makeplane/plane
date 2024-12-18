import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IIssueFilterOptions } from "@plane/types";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
// hooks
import { useCommandPalette, useEventTracker, useIssues } from "@/hooks/store";

export const TeamViewEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamId, viewId } = useParams();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.TEAM_VIEW);
  // derived values
  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );
  const emptyStateType = issueFilterCount > 0 ? EmptyStateType.TEAM_EMPTY_FILTER : EmptyStateType.TEAM_NO_ISSUES;
  const additionalPath = issueFilterCount > 0 ? (activeLayout ?? "list") : undefined;

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !teamId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    issuesFilter.updateFilters(
      workspaceSlug.toString(),
      teamId.toString(),
      EIssueFilterType.FILTERS,
      {
        ...newFilters,
      },
      viewId.toString()
    );
  };

  if (!workspaceSlug || !teamId || !viewId) return null;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState
        type={emptyStateType}
        additionalPath={additionalPath}
        primaryButtonOnClick={
          issueFilterCount > 0
            ? undefined
            : () => {
                setTrackElement("Team issue empty state");
                toggleCreateIssueModal(true, EIssuesStoreType.TEAM_VIEW);
              }
        }
        secondaryButtonOnClick={issueFilterCount > 0 ? handleClearAllFilters : undefined}
      />
    </div>
  );
});
