import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { AppliedFiltersList } from "components/issues";
// types
import { IIssueFilterOptions } from "types";

export const ArchivedIssueAppliedFiltersRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    archivedIssueFilters: archivedIssueFiltersStore,
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
  } = useMobxStore();

  const userFilters = archivedIssueFiltersStore.userFilters;

  // filters whose value not null or empty array
  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(userFilters).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value) && value.length === 0) return;

    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !projectId) return;

    // remove all values of the key if value is null
    if (!value) {
      archivedIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        filters: {
          [key]: null,
        },
      });
      return;
    }

    // remove the passed value from the key
    let newValues = archivedIssueFiltersStore.userFilters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    archivedIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        [key]: newValues,
      },
    });
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;

    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
    });

    archivedIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: { ...newFilters },
    });
  };

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="p-4">
      <AppliedFiltersList
        appliedFilters={appliedFilters}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? []}
        members={projectMembers?.map((m) => m.member)}
        states={projectStateStore.states?.[projectId?.toString() ?? ""]}
      />
    </div>
  );
});
