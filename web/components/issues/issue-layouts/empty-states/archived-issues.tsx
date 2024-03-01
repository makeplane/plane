import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import size from "lodash/size";
// hooks
import { useIssues } from "hooks/store";
// components
import { EmptyState } from "components/empty-state";
// constants
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
// types
import { IIssueFilterOptions } from "@plane/types";

export const ProjectArchivedEmptyState: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
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
      newFilters[key as keyof IIssueFilterOptions] = null;
    });
    issuesFilter.updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
      ...newFilters,
    });
  };

  const emptyStateType = issueFilterCount > 0 ? "project-archived-empty-filter" : "project-archived-no-issues";
  const additionalPath = issueFilterCount > 0 ? activeLayout ?? "list" : undefined;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState
        type={emptyStateType}
        additionalPath={additionalPath}
        primaryButtonOnClick={
          issueFilterCount > 0
            ? undefined
            : () => router.push(`/${workspaceSlug}/projects/${projectId}/settings/automations`)
        }
        secondaryButtonOnClick={issueFilterCount > 0 ? handleClearAllFilters : undefined}
      />
    </div>
  );
});
