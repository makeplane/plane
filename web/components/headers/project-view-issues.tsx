import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

export const ProjectViewIssuesHeader: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const {
    issueFilter: issueFilterStore,
    projectViewFilters: projectViewFiltersStore,
    project: projectStore,
  } = useMobxStore();

  const storedFilters = viewId ? projectViewFiltersStore.storedFilters[viewId.toString()] : undefined;

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          layout,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !viewId) return;

      const newValues = storedFilters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (storedFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      projectViewFiltersStore.updateStoredFilters(viewId.toString(), {
        [key]: newValues,
      });
    },
    [projectViewFiltersStore, storedFilters, viewId, workspaceSlug]
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          ...updatedDisplayFilter,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateDisplayProperties(workspaceSlug.toString(), projectId.toString(), property);
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  return (
    <div className="flex items-center gap-2">
      <LayoutSelection
        layouts={["list", "kanban", "calendar", "spreadsheet", "gantt_chart"]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />
      <FiltersDropdown title="Filters">
        <FilterSelection
          filters={storedFilters ?? {}}
          handleFiltersUpdate={handleFiltersUpdate}
          layoutDisplayFiltersOptions={activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined}
          labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? undefined}
          members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
          states={projectStore.states?.[projectId?.toString() ?? ""] ?? undefined}
        />
      </FiltersDropdown>
      <FiltersDropdown title="View">
        <DisplayFiltersSelection
          displayFilters={issueFilterStore.userDisplayFilters}
          displayProperties={issueFilterStore.userDisplayProperties}
          handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
          handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
          layoutDisplayFiltersOptions={activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined}
        />
      </FiltersDropdown>
    </div>
  );
});
