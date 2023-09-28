import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
// types
import { IIssueDisplayFilterOptions, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

export const ProjectIssuesHeader: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const handleLayoutChange = (layout: TIssueLayouts) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        layout,
      },
    });
  };

  const handleFiltersUpdate = (key: keyof IIssueFilterOptions, value: string) => {
    if (!workspaceSlug || !projectId) return;

    const newValues = issueFilterStore.userFilters?.[key] ?? [];

    if (issueFilterStore.userFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
    else newValues.push(value);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        [key]: newValues,
      },
    });
  };

  const handleDisplayFiltersUpdate = (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        ...updatedDisplayFilter,
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <LayoutSelection
        layouts={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues.layout}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={issueFilterStore.userDisplayFilters.layout ?? "list"}
      />
      <FiltersDropdown title="Filters">
        <FilterSelection
          filters={{}}
          handleFiltersUpdate={handleFiltersUpdate}
          layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues}
          projectId={projectId?.toString() ?? ""}
        />
      </FiltersDropdown>
      <FiltersDropdown title="View">
        <DisplayFiltersSelection
          displayFilters={issueFilterStore.userDisplayFilters}
          handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
          layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues}
        />
      </FiltersDropdown>
    </div>
  );
});
