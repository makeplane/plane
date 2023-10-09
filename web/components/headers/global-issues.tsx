import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection } from "components/issues";
// ui
import { Tooltip } from "components/ui";
// icons
import { List, Sheet } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueFilterOptions } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

const GLOBAL_VIEW_LAYOUTS = [
  { key: "list", title: "List", icon: List },
  { key: "spreadsheet", title: "Spreadsheet", icon: Sheet },
];

type Props = {
  activeLayout: "list" | "spreadsheet";
};

export const GlobalIssuesHeader: React.FC<Props> = observer((props) => {
  const { activeLayout } = props;

  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const { workspaceFilter: workspaceFilterStore, workspace: workspaceStore } = useMobxStore();

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !globalViewId) return;
    },
    [globalViewId, workspaceSlug]
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;
    },
    [globalViewId, workspaceSlug]
  );

  useSWR(
    workspaceSlug ? "USER_WORKSPACE_FILTERS" : null,
    workspaceSlug ? () => workspaceFilterStore.fetchUserWorkspaceFilters(workspaceSlug.toString()) : null
  );

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 p-1 rounded bg-custom-background-80">
        {GLOBAL_VIEW_LAYOUTS.map((layout) => (
          <Tooltip key={layout.key} tooltipContent={layout.title}>
            <button
              type="button"
              className={`w-7 h-[22px] rounded grid place-items-center transition-all hover:bg-custom-background-100 overflow-hidden group ${
                activeLayout === layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
              }`}
            >
              <layout.icon
                size={14}
                strokeWidth={2}
                className={`${activeLayout === layout.key ? "text-custom-text-100" : "text-custom-text-200"}`}
              />
            </button>
          </Tooltip>
        ))}
      </div>
      <FiltersDropdown title="Filters">
        <FilterSelection
          filters={{}}
          handleFiltersUpdate={handleFiltersUpdate}
          layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
          labels={workspaceStore.workspaceLabels}
        />
      </FiltersDropdown>
      <FiltersDropdown title="View">
        <DisplayFiltersSelection
          displayFilters={{}}
          handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
          layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
        />
      </FiltersDropdown>
    </div>
  );
});
