import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IIssueFilterOptions } from "@plane/types";
// hooks
import { AppliedFiltersList, SaveFilterView } from "@/components/issues";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useIssues, useLabel, useProjectState } from "@/hooks/store";
// components
// types

export const ModuleAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId, moduleId } = useParams();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.MODULE);
  const { projectLabels } = useLabel();
  const { projectStates } = useProjectState();
  // derived values
  const userFilters = issueFilters?.filters;
  // filters whose value not null or empty array
  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(userFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !projectId || !moduleId) return;
    if (!value) {
      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        {
          [key]: null,
        },
        moduleId.toString()
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
      moduleId.toString()
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !moduleId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(
      workspaceSlug.toString(),
      projectId.toString(),
      EIssueFilterType.FILTERS,
      { ...newFilters },
      moduleId.toString()
    );
  };

  // return if no filters are applied
  if (!workspaceSlug || !projectId || !moduleId || Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="flex justify-between p-4 gap-2.5">
      <AppliedFiltersList
        appliedFilters={appliedFilters}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        labels={projectLabels ?? []}
        states={projectStates}
      />

      <SaveFilterView
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        filterParams={{
          filters: { ...appliedFilters, module: [moduleId.toString()] },
          display_filters: issueFilters?.displayFilters,
          display_properties: issueFilters?.displayProperties,
        }}
      />
    </div>
  );
});
