import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection } from "components/issues";
import { CreateUpdateWorkspaceViewModal } from "components/workspace";
// ui
import { PrimaryButton, Tooltip } from "components/ui";
// icons
import { List, PlusIcon, Sheet } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueFilterOptions } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

const GLOBAL_VIEW_LAYOUTS = [
  { key: "list", title: "List", link: "/workspace-views", icon: List },
  { key: "spreadsheet", title: "Spreadsheet", link: "/workspace-views/all-issues", icon: Sheet },
];

type Props = {
  activeLayout: "list" | "spreadsheet";
};

export const GlobalIssuesHeader: React.FC<Props> = observer((props) => {
  const { activeLayout } = props;

  const [createViewModal, setCreateViewModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { workspaceFilter: workspaceFilterStore, workspace: workspaceStore } = useMobxStore();

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug) return;
    },
    [workspaceSlug]
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug) return;

      workspaceFilterStore.updateWorkspaceFilters(workspaceSlug.toString(), {
        display_filters: updatedDisplayFilter,
      });
    },
    [workspaceFilterStore, workspaceSlug]
  );

  useSWR(
    workspaceSlug ? "USER_WORKSPACE_FILTERS" : null,
    workspaceSlug ? () => workspaceFilterStore.fetchUserWorkspaceFilters(workspaceSlug.toString()) : null
  );

  return (
    <>
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded bg-custom-background-80">
          {GLOBAL_VIEW_LAYOUTS.map((layout) => (
            <Link key={layout.key} href={`/${workspaceSlug}/${layout.link}`}>
              <a>
                <Tooltip tooltipContent={layout.title}>
                  <div
                    className={`w-7 h-[22px] rounded grid place-items-center transition-all hover:bg-custom-background-100 overflow-hidden group ${
                      activeLayout === layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
                    }`}
                  >
                    <layout.icon
                      size={14}
                      strokeWidth={2}
                      className={`${activeLayout === layout.key ? "text-custom-text-100" : "text-custom-text-200"}`}
                    />
                  </div>
                </Tooltip>
              </a>
            </Link>
          ))}
        </div>
        {activeLayout === "list" && (
          <>
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
                displayFilters={workspaceFilterStore.workspaceDisplayFilters}
                handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
                layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
              />
            </FiltersDropdown>
          </>
        )}
        <PrimaryButton className="flex items-center gap-2" onClick={() => setCreateViewModal(true)}>
          <PlusIcon className="h-4 w-4" />
          New View
        </PrimaryButton>
      </div>
    </>
  );
});
