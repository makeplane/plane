import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import size from "lodash/size";
// hooks
import { useApplication, useEventTracker, useIssues } from "hooks/store";
// components
import { EmptyState } from "components/empty-state";
// constants
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
// types
import { IIssueFilterOptions } from "@plane/types";

export const ProjectEmptyState: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
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
      newFilters[key as keyof IIssueFilterOptions] = null;
    });
    issuesFilter.updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
      ...newFilters,
    });
  };

  const emptyStateType = issueFilterCount > 0 ? "project-empty-filter" : "project-no-issues";
  const additionalPath = issueFilterCount > 0 ? activeLayout ?? "list" : undefined;
  const emptyStateSize = issueFilterCount > 0 ? "lg" : "sm";

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState
        type={emptyStateType}
        additionalPath={additionalPath}
        size={emptyStateSize}
        primaryButtonOnClick={
          issueFilterCount > 0
            ? undefined
            : () => {
                setTrackElement("Project issue empty state");
                commandPaletteStore.toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              }
        }
        secondaryButtonOnClick={issueFilterCount > 0 ? handleClearAllFilters : undefined}
      />
    </div>
  );
});
