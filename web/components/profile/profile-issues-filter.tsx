import { observer } from "mobx-react-lite";
// components
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown, LayoutSelection } from "components/issues";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

export const ProfileIssuesFilter = observer(() => {
  const { workspace: workspaceStore, profileIssueFilters: profileIssueFiltersStore }: RootStore = useMobxStore();

  const handleLayoutChange = (_layout: string) => {
    const payload = {
      layout: _layout,
      group_by: profileIssueFiltersStore.userDisplayFilters.group_by
        ? profileIssueFiltersStore.userDisplayFilters.group_by
        : "state_detail.group",
    };

    profileIssueFiltersStore.handleIssueFilters("userDisplayFilters", payload);
  };

  const handleFilters = (key: any, value: any) => {
    let updatesFilters: any = profileIssueFiltersStore?.userFilters;
    updatesFilters = updatesFilters[key] || [];
    if (updatesFilters && updatesFilters.length > 0 && updatesFilters.includes(value))
      updatesFilters = updatesFilters.filter((item: any) => item !== value);
    else updatesFilters.push(value);
    profileIssueFiltersStore.handleIssueFilters("userFilters", { [key]: updatesFilters });
  };

  const handleDisplayFilters = (value: any) => profileIssueFiltersStore.handleIssueFilters("userDisplayFilters", value);

  const handleDisplayProperties = (value: any) =>
    profileIssueFiltersStore.handleIssueFilters("userDisplayProperties", value);

  const states = undefined;
  const labels = workspaceStore.workspaceLabels || undefined;
  const members = undefined;

  const activeLayout = profileIssueFiltersStore?.userDisplayFilters?.layout;

  return (
    <div className="relative flex items-center justify-end gap-2">
      <LayoutSelection
        layouts={["list", "kanban"]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />

      <FiltersDropdown title="Filters" placement="bottom-end">
        <FilterSelection
          filters={profileIssueFiltersStore.userFilters}
          handleFiltersUpdate={handleFilters}
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.profile_issues[activeLayout] : undefined
          }
          states={states}
          labels={labels}
          members={members}
        />
      </FiltersDropdown>

      <FiltersDropdown title="Display" placement="bottom-end">
        <DisplayFiltersSelection
          displayFilters={profileIssueFiltersStore.userDisplayFilters}
          displayProperties={profileIssueFiltersStore.userDisplayProperties}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          handleDisplayPropertiesUpdate={handleDisplayProperties}
          layoutDisplayFiltersOptions={
            activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.profile_issues[activeLayout] : undefined
          }
        />
      </FiltersDropdown>
    </div>
  );
});
