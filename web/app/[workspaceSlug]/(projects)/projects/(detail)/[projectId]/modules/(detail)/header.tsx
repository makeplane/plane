"use client";

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// icons
import { ArrowRight, PanelRight } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
// ui
import { Breadcrumbs, Button, CustomMenu, DiceIcon, Tooltip, Header } from "@plane/ui";
// components
import { ProjectAnalyticsModal } from "@/components/analytics";
import { BreadcrumbLink, Logo } from "@/components/common";
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
// constants
import {
  EIssuesStoreType,
  EIssueFilterType,
  EIssueLayoutTypes,
  ISSUE_DISPLAY_FILTERS_BY_LAYOUT,
} from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { isIssueFilterActive } from "@/helpers/filter.helper";
import { truncateText } from "@/helpers/string.helper";
// hooks
import {
  useEventTracker,
  useLabel,
  useMember,
  useModule,
  useProject,
  useProjectState,
  useIssues,
  useCommandPalette,
  useUserPermissions,
} from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import useLocalStorage from "@/hooks/use-local-storage";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const ModuleDropdownOption: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const moduleDetail = getModuleById(moduleId);

  if (!moduleDetail) return null;

  return (
    <CustomMenu.MenuItem key={moduleDetail.id}>
      <Link
        href={`/${workspaceSlug}/projects/${projectId}/modules/${moduleDetail.id}`}
        className="flex items-center gap-1.5"
      >
        <DiceIcon className="h-3 w-3" />
        {truncateText(moduleDetail.name, 40)}
      </Link>
    </CustomMenu.MenuItem>
  );
};

export const ModuleIssuesHeader: React.FC = observer(() => {
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, moduleId } = useParams();
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    issuesFilter: { issueFilters },
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.MODULE);
  const { updateFilters } = useIssuesActions(EIssuesStoreType.MODULE);
  const { projectModuleIds, getModuleById } = useModule();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();
  const { projectLabels } = useLabel();
  const { projectStates } = useProjectState();
  const {
    project: { projectMemberIds },
  } = useMember();

  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");

  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [projectId, updateFilters]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!projectId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        // this validation is majorly for the filter start_date, target_date custom
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), EIssueFilterType.FILTERS, { [key]: newValues });
    },
    [projectId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [projectId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [projectId, updateFilters]
  );

  // derived values
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : undefined;
  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const issuesCount = getGroupIssueCount(undefined, undefined, false);

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        moduleDetails={moduleDetails ?? undefined}
      />
      <Header>
        <Header.LeftItem>
          <Breadcrumbs onBack={router.back} isLoading={loader}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <span>
                  <span className="hidden md:block">
                    <BreadcrumbLink
                      label={currentProjectDetails?.name ?? "Project"}
                      href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                      icon={
                        currentProjectDetails && (
                          <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                            <Logo logo={currentProjectDetails?.logo_props} size={16} />
                          </span>
                        )
                      }
                    />
                  </span>
                  <Link
                    href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                    className="block pl-2 text-custom-text-300 md:hidden"
                  >
                    ...
                  </Link>
                </span>
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${projectId}/modules`}
                  label="Modules"
                  icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="component"
              component={
                <CustomMenu
                  label={
                    <>
                      <DiceIcon className="h-3 w-3" />
                      <div className="flex w-auto max-w-[70px] items-center gap-2 truncate sm:max-w-[200px]">
                        <p className="truncate">{moduleDetails?.name && moduleDetails.name}</p>
                        {issuesCount && issuesCount > 0 ? (
                          <Tooltip
                            isMobile={isMobile}
                            tooltipContent={`There are ${issuesCount} ${
                              issuesCount > 1 ? "issues" : "issue"
                            } in this module`}
                            position="bottom"
                          >
                            <span className="flex flex-shrink-0 cursor-default items-center justify-center rounded-xl bg-custom-primary-100/20 px-2 text-center text-xs font-semibold text-custom-primary-100">
                              {issuesCount}
                            </span>
                          </Tooltip>
                        ) : null}
                      </div>
                    </>
                  }
                  className="ml-1.5 flex-shrink-0"
                  placement="bottom-start"
                >
                  {projectModuleIds?.map((moduleId) => <ModuleDropdownOption key={moduleId} moduleId={moduleId} />)}
                </CustomMenu>
              }
            />
          </Breadcrumbs>
        </Header.LeftItem>
        <Header.RightItem>
          <div className="hidden gap-2 md:flex">
            <LayoutSelection
              layouts={[
                EIssueLayoutTypes.LIST,
                EIssueLayoutTypes.KANBAN,
                EIssueLayoutTypes.CALENDAR,
                EIssueLayoutTypes.SPREADSHEET,
                EIssueLayoutTypes.GANTT,
              ]}
              onChange={(layout) => handleLayoutChange(layout)}
              selectedLayout={activeLayout}
            />
            <FiltersDropdown
              title="Filters"
              placement="bottom-end"
              isFiltersApplied={isIssueFilterActive(issueFilters)}
            >
              <FilterSelection
                filters={issueFilters?.filters ?? {}}
                handleFiltersUpdate={handleFiltersUpdate}
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFiltersUpdate={handleDisplayFilters}
                layoutDisplayFiltersOptions={
                  activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
                }
                labels={projectLabels}
                memberIds={projectMemberIds ?? undefined}
                states={projectStates}
                cycleViewDisabled={!currentProjectDetails?.cycle_view}
                moduleViewDisabled={!currentProjectDetails?.module_view}
              />
            </FiltersDropdown>
            <FiltersDropdown title="Display" placement="bottom-end">
              <DisplayFiltersSelection
                layoutDisplayFiltersOptions={
                  activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
                }
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFiltersUpdate={handleDisplayFilters}
                displayProperties={issueFilters?.displayProperties ?? {}}
                handleDisplayPropertiesUpdate={handleDisplayProperties}
                ignoreGroupedFilters={["module"]}
                cycleViewDisabled={!currentProjectDetails?.cycle_view}
                moduleViewDisabled={!currentProjectDetails?.module_view}
              />
            </FiltersDropdown>
          </div>

          {canUserCreateIssue ? (
            <>
              <Button
                className="hidden md:block"
                onClick={() => setAnalyticsModal(true)}
                variant="neutral-primary"
                size="sm"
              >
                Analytics
              </Button>
              <Button
                className="hidden sm:flex"
                onClick={() => {
                  setTrackElement("Module issues page");
                  toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
                }}
                size="sm"
              >
                Add issue
              </Button>
            </>
          ) : (
            <></>
          )}
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80"
            onClick={toggleSidebar}
          >
            <ArrowRight className={`hidden h-4 w-4 duration-300 md:block ${isSidebarCollapsed ? "-rotate-180" : ""}`} />
            <PanelRight
              className={cn("block h-4 w-4 md:hidden", !isSidebarCollapsed ? "text-[#3E63DD]" : "text-custom-text-200")}
            />
          </button>
        </Header.RightItem>
      </Header>
    </>
  );
});
