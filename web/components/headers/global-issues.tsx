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
import { Button, Tooltip } from "@plane/ui";
// icons
import { CheckCircle, List, PlusIcon, Sheet } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TStaticViewTypes } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

const GLOBAL_VIEW_LAYOUTS = [
  { key: "list", title: "List", link: "/workspace-views", icon: List },
  { key: "spreadsheet", title: "Spreadsheet", link: "/workspace-views/all-issues", icon: Sheet },
];

type Props = {
  activeLayout: "list" | "spreadsheet";
};

const STATIC_VIEW_TYPES: TStaticViewTypes[] = ["all-issues", "assigned", "created", "subscribed"];

export const GlobalIssuesHeader: React.FC<Props> = observer((props) => {
  const { activeLayout } = props;

  const [createViewModal, setCreateViewModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const {
    globalViewFilters: globalViewFiltersStore,
    workspaceFilter: workspaceFilterStore,
    workspace: workspaceStore,
    project: projectStore,
  } = useMobxStore();

  const storedFilters = globalViewId ? globalViewFiltersStore.storedFilters[globalViewId.toString()] : undefined;

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !globalViewId) return;

      const newValues = storedFilters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (storedFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      globalViewFiltersStore.updateStoredFilters(globalViewId.toString(), {
        [key]: newValues,
      });
    },
    [globalViewId, globalViewFiltersStore, storedFilters, workspaceSlug]
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

  const handleDisplayPropertiesUpdate = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug) return;

      workspaceFilterStore.updateWorkspaceFilters(workspaceSlug.toString(), {
        display_properties: property,
      });
    },
    [workspaceFilterStore, workspaceSlug]
  );

  useSWR(
    workspaceSlug ? "USER_WORKSPACE_DISPLAY_FILTERS" : null,
    workspaceSlug ? () => workspaceFilterStore.fetchUserWorkspaceFilters(workspaceSlug.toString()) : null
  );

  return (
    <>
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div className="relative w-full flex items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div className="flex gap-2 items-center">
          {activeLayout === "spreadsheet" && <CheckCircle size={16} strokeWidth={2} />}
          <span className="text-sm font-medium">Workspace {activeLayout === "spreadsheet" ? "Issues" : "Views"}</span>
        </div>
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
          {activeLayout === "spreadsheet" && (
            <>
              {!STATIC_VIEW_TYPES.some((word) => router.pathname.includes(word)) && (
                <FiltersDropdown title="Filters">
                  <FilterSelection
                    filters={storedFilters ?? {}}
                    handleFiltersUpdate={handleFiltersUpdate}
                    layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
                    labels={workspaceStore.workspaceLabels ?? undefined}
                    projects={workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined}
                  />
                </FiltersDropdown>
              )}

              <FiltersDropdown title="View">
                <DisplayFiltersSelection
                  displayFilters={workspaceFilterStore.workspaceDisplayFilters}
                  displayProperties={workspaceFilterStore.workspaceDisplayProperties}
                  handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
                  handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
                  layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
                />
              </FiltersDropdown>
            </>
          )}
          <Button variant="primary" prependIcon={<PlusIcon />} onClick={() => setCreateViewModal(true)}>
            New View
          </Button>
        </div>
      </div>
    </>
  );
});
