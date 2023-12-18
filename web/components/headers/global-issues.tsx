import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection } from "components/issues";
import { CreateUpdateWorkspaceViewModal } from "components/workspace";
// ui
import { Breadcrumbs, Button, LayersIcon, PhotoFilterIcon, Tooltip } from "@plane/ui";
// icons
import { List, PlusIcon, Sheet } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
import { EFilterType } from "store/issues/types";
import { EUserWorkspaceRoles } from "constants/workspace";

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
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const {
    workspace: { workspaceLabels },
    workspaceMember: { workspaceMembers },
    project: { workspaceProjects },
    user: { currentWorkspaceRole },
    workspaceGlobalIssuesFilter: { issueFilters, updateFilters },
  } = useMobxStore();

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

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <>
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div className="relative z-10 flex h-[3.75rem] w-full items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={
                activeLayout === "spreadsheet" ? (
                  <LayersIcon className="h-4 w-4 text-custom-text-300" />
                ) : (
                  <PhotoFilterIcon className="h-4 w-4 text-custom-text-300" />
                )
              }
              label={`Workspace ${activeLayout === "spreadsheet" ? "Issues" : "Views"}`}
            />
          </Breadcrumbs>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded bg-custom-background-80 p-1">
            {GLOBAL_VIEW_LAYOUTS.map((layout) => (
              <Link key={layout.key} href={`/${workspaceSlug}/${layout.link}`}>
                <span>
                  <Tooltip tooltipContent={layout.title}>
                    <div
                      className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-custom-background-100 ${
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
                </span>
              </Link>
            ))}
          </div>

          {activeLayout === "spreadsheet" && (
            <>
              <FiltersDropdown title="Filters" placement="bottom-end">
                <FilterSelection
                  layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
                  filters={issueFilters?.filters ?? {}}
                  handleFiltersUpdate={handleFiltersUpdate}
                  labels={workspaceLabels ?? undefined}
                  members={workspaceMembers?.map((m) => m.member)}
                  projects={workspaceProjects ?? undefined}
                />
              </FiltersDropdown>
              <FiltersDropdown title="Display" placement="bottom-end">
                <DisplayFiltersSelection
                  layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet}
                  displayFilters={issueFilters?.displayFilters ?? {}}
                  handleDisplayFiltersUpdate={handleDisplayFilters}
                  displayProperties={issueFilters?.displayProperties ?? {}}
                  handleDisplayPropertiesUpdate={handleDisplayProperties}
                />
              </FiltersDropdown>
            </>
          )}
          {isAuthorizedUser && (
            <Button variant="primary" size="sm" prependIcon={<PlusIcon />} onClick={() => setCreateViewModal(true)}>
              New View
            </Button>
          )}
        </div>
      </div>
    </>
  );
});
