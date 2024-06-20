import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IIssueFilterOptions } from "@plane/types";
// hooks
// components
import { AppliedFiltersList, SaveFilterView } from "@/components/issues";
// constants
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useLabel, useProjectState, useUser } from "@/hooks/store";
import { useIssues } from "@/hooks/store/use-issues";
// types

export const ProjectAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams() as {
    workspaceSlug: string;
    projectId: string;
  };
  // store hooks
  const { projectLabels } = useLabel();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT);
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { projectStates } = useProjectState();
  // derived values
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
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
      updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
        [key]: null,
      });
      return;
    }

    let newValues = issueFilters?.filters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
      [key]: newValues,
    });
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, { ...newFilters });
  };

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="flex justify-between p-4 gap-2.5">
      <AppliedFiltersList
        appliedFilters={appliedFilters}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        labels={projectLabels ?? []}
        states={projectStates}
      />
      {isEditingAllowed && (
        <SaveFilterView
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          filterParams={{
            filters: appliedFilters,
            display_filters: issueFilters?.displayFilters,
            display_properties: issueFilters?.displayProperties,
          }}
        />
      )}
    </div>
  );
});
