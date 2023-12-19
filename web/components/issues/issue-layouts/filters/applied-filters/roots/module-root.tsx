import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useProjectState } from "hooks/store";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { AppliedFiltersList, SaveFilterView } from "components/issues";
// types
import { IIssueFilterOptions } from "types";
import { EIssueFilterType } from "constants/issue";

export const ModuleAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };
  // store hooks
  const {
    projectLabel: { projectLabels },
    projectMember: { projectMembers },
    moduleIssuesFilter: { issueFilters, updateFilters },
  } = useMobxStore();
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
    if (!workspaceSlug || !projectId) return;
    if (!value) {
      updateFilters(
        workspaceSlug,
        projectId,
        EIssueFilterType.FILTERS,
        {
          [key]: null,
        },
        moduleId
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
      moduleId
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
    });
    updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { ...newFilters }, moduleId);
  };

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="flex items-center justify-between p-4">
      <AppliedFiltersList
        appliedFilters={appliedFilters}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        labels={projectLabels ?? []}
        members={projectMembers?.map((m) => m.member)}
        states={projectStates}
      />

      <SaveFilterView workspaceSlug={workspaceSlug} projectId={projectId} filterParams={appliedFilters} />
    </div>
  );
});
