import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// components
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown, LayoutSelection } from "components/issues";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
import { EFilterType } from "store/issues/types";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";

export const ProfileIssuesFilter = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as {
    workspaceSlug: string;
  };

  const {
    workspace: workspaceStore,
    workspaceProfileIssuesFilter: { issueFilters, updateFilters },
  }: RootStore = useMobxStore();

  const states = undefined;
  const labels = workspaceStore.workspaceLabels || undefined;
  const members = undefined;

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug) return;
      updateFilters(workspaceSlug, EFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [workspaceSlug, updateFilters]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(workspaceSlug, EFilterType.FILTERS, { [key]: newValues });
    },
    [workspaceSlug, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug) return;
      updateFilters(workspaceSlug, EFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [workspaceSlug, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug) return;
      updateFilters(workspaceSlug, EFilterType.DISPLAY_PROPERTIES, property);
    },
    [workspaceSlug, updateFilters]
  );

  return (
    <div className="relative flex items-center justify-end gap-2">
      <LayoutSelection
        layouts={["list", "kanban"]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />

      <FiltersDropdown title="Filters" placement="bottom-end">
        <FilterSelection
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.profile_issues[activeLayout] : undefined
          }
          filters={issueFilters?.filters ?? {}}
          handleFiltersUpdate={handleFiltersUpdate}
          states={states}
          labels={labels}
          members={members}
        />
      </FiltersDropdown>

      <FiltersDropdown title="Display" placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.profile_issues[activeLayout] : undefined
          }
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          displayProperties={issueFilters?.displayProperties ?? {}}
          handleDisplayPropertiesUpdate={handleDisplayProperties}
        />
      </FiltersDropdown>
    </div>
  );
});
