import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IIssueFilterOptions } from "@plane/types";
// hooks
import { Button } from "@plane/ui";
import { AppliedFiltersList } from "@/components/issues";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useIssues, useLabel, useProjectState, useProjectView } from "@/hooks/store";
// components
// ui
// types

export const ProjectViewAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { projectLabels } = useLabel();
  const { projectStates } = useProjectState();
  const { viewMap, updateView } = useProjectView();
  // derived values
  const viewDetails = viewId ? viewMap[viewId.toString()] : null;
  const userFilters = issueFilters?.filters;
  // filters whose value not null or empty array
  let appliedFilters: IIssueFilterOptions | undefined = undefined;
  Object.entries(userFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    if (!appliedFilters) appliedFilters = {};
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !projectId || !viewId) return;
    if (!value) {
      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        {
          [key]: null,
        },
        viewId.toString()
      );
      return;
    }

    let newValues = issueFilters?.filters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    updateFilters(
      workspaceSlug.toString(),
      projectId.toString(),
      EIssueFilterType.FILTERS,
      {
        [key]: newValues,
      },
      viewId.toString()
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !viewId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(
      workspaceSlug.toString(),
      projectId.toString(),
      EIssueFilterType.FILTERS,
      { ...newFilters },
      viewId.toString()
    );
  };

  const areFiltersEqual = isEqual(appliedFilters ?? {}, viewDetails?.filters ?? {});

  // return if no filters are applied
  if (isEmpty(appliedFilters) && areFiltersEqual) return null;

  const handleUpdateView = () => {
    if (!workspaceSlug || !projectId || !viewId || !viewDetails) return;

    updateView(workspaceSlug.toString(), projectId.toString(), viewId.toString(), {
      filters: {
        ...(appliedFilters ?? {}),
      },
    });
  };

  return (
    <div className="flex justify-between gap-4 p-4">
      <div>
        <AppliedFiltersList
          appliedFilters={appliedFilters ?? {}}
          handleClearAllFilters={handleClearAllFilters}
          handleRemoveFilter={handleRemoveFilter}
          labels={projectLabels ?? []}
          states={projectStates}
          alwaysAllowEditing
        />
      </div>

      {!areFiltersEqual && (
        <div>
          <Button variant="primary" size="sm" className="flex-shrink-0" onClick={handleUpdateView}>
            Update view
          </Button>
        </div>
      )}
    </div>
  );
});
