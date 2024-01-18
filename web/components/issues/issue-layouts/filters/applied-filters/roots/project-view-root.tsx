import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues, useLabel, useProjectState, useProjectView } from "hooks/store";
// components
import { AppliedFiltersList } from "components/issues";
// ui
import { Button } from "@plane/ui";
// helpers
import { areFiltersDifferent } from "helpers/filter.helper";
// types
import { IIssueFilterOptions } from "@plane/types";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export const ProjectViewAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    viewId: string;
  };
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const {
    project: { projectLabels },
  } = useLabel();
  const { projectStates } = useProjectState();
  const { viewMap, updateView } = useProjectView();
  // derived values
  const viewDetails = viewId ? viewMap[viewId.toString()] : null;
  const userFilters = issueFilters?.filters;
  // filters whose value not null or empty array
  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(userFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !projectId) return;
    if (!value) {
      updateFilters(
        workspaceSlug,
        projectId,
        EIssueFilterType.FILTERS,
        {
          [key]: null,
        },
        viewId
      );
      return;
    }

    let newValues = issueFilters?.filters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    updateFilters(
      workspaceSlug,
      projectId,
      EIssueFilterType.FILTERS,
      {
        [key]: newValues,
      },
      viewId
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
    });
    updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { ...newFilters }, viewId);
  };

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0 && !areFiltersDifferent(appliedFilters, viewDetails?.filters ?? {}))
    return null;

  const handleUpdateView = () => {
    if (!workspaceSlug || !projectId || !viewId || !viewDetails) return;

    updateView(workspaceSlug.toString(), projectId.toString(), viewId.toString(), {
      filters: {
        ...(appliedFilters ?? {}),
      },
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <AppliedFiltersList
        appliedFilters={appliedFilters}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        labels={projectLabels ?? []}
        states={projectStates}
      />

      {viewDetails?.filters && areFiltersDifferent(appliedFilters, viewDetails?.filters ?? {}) && (
        <div className="flex flex-shrink-0 items-center justify-center">
          <Button variant="primary" size="sm" onClick={handleUpdateView}>
            Update view
          </Button>
        </div>
      )}
    </div>
  );
});
