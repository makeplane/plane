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
import { Breadcrumbs, Button, ContrastIcon, CustomMenu, Tooltip } from "@plane/ui";
// components
import { ProjectAnalyticsModal } from "@/components/analytics";
import { BreadcrumbLink, Logo } from "@/components/common";
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
// constants
import {
  EIssueFilterType,
  EIssueLayoutTypes,
  EIssuesStoreType,
  ISSUE_DISPLAY_FILTERS_BY_LAYOUT,
} from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { cn } from "@/helpers/common.helper";
import { isIssueFilterActive } from "@/helpers/filter.helper";
import { truncateText } from "@/helpers/string.helper";
// hooks
import {
  useEventTracker,
  useCycle,
  useLabel,
  useMember,
  useProject,
  useProjectState,
  useUser,
  useIssues,
  useCommandPalette,
} from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import useLocalStorage from "@/hooks/use-local-storage";
import { usePlatformOS } from "@/hooks/use-platform-os";

const CycleDropdownOption: React.FC<{ cycleId: string }> = ({ cycleId }) => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getCycleById } = useCycle();
  // derived values
  const cycle = getCycleById(cycleId);
  //

  if (!cycle) return null;

  return (
    <CustomMenu.MenuItem key={cycle.id}>
      <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`} className="flex items-center gap-1.5">
        <ContrastIcon className="h-3 w-3" />
        {truncateText(cycle.name, 40)}
      </Link>
    </CustomMenu.MenuItem>
  );
};

export const CycleIssuesHeader: React.FC = observer(() => {
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, cycleId } = useParams() as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCycleIds, getCycleById } = useCycle();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails, loader } = useProject();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();
  const { isMobile } = usePlatformOS();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const { setValue, storedValue } = useLocalStorage("cycle_sidebar_collapsed", "false");

  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, cycleId);
    },
    [workspaceSlug, projectId, cycleId, updateFilters]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;
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

      updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { [key]: newValues }, cycleId);
    },
    [workspaceSlug, projectId, cycleId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, cycleId);
    },
    [workspaceSlug, projectId, cycleId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property, cycleId);
    },
    [workspaceSlug, projectId, cycleId, updateFilters]
  );

  // derived values
  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const isCompletedCycle = cycleDetails?.status?.toLocaleLowerCase() === "completed";
  const canUserCreateIssue =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  const issuesCount = getGroupIssueCount(undefined, undefined, false);

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        cycleDetails={cycleDetails ?? undefined}
      />
      <div className="relative z-[15] w-full items-center gap-x-2 gap-y-4">
        <div className="flex justify-between bg-custom-sidebar-background-100 p-4">
          <div className="flex items-center gap-2">
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
                    label="Cycles"
                    href={`/${workspaceSlug}/projects/${projectId}/cycles`}
                    icon={<ContrastIcon className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="component"
                component={
                  <CustomMenu
                    label={
                      <>
                        <ContrastIcon className="h-3 w-3" />
                        <div className="flex w-auto max-w-[70px] items-center gap-2 truncate sm:max-w-[200px]">
                          <p className="truncate">{cycleDetails?.name && cycleDetails.name}</p>
                          {issuesCount && issuesCount > 0 ? (
                            <Tooltip
                              isMobile={isMobile}
                              tooltipContent={`There are ${issuesCount} ${
                                issuesCount > 1 ? "issues" : "issue"
                              } in this cycle`}
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
                    className="ml-1.5 flex-shrink-0 truncate"
                    placement="bottom-start"
                  >
                    {currentProjectCycleIds?.map((cycleId) => <CycleDropdownOption key={cycleId} cycleId={cycleId} />)}
                  </CustomMenu>
                }
              />
            </Breadcrumbs>
          </div>
          <div className="hidden items-center gap-2 md:flex ">
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
                layoutDisplayFiltersOptions={
                  activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
                }
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFiltersUpdate={handleDisplayFilters}
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
                ignoreGroupedFilters={["cycle"]}
                cycleViewDisabled={!currentProjectDetails?.cycle_view}
                moduleViewDisabled={!currentProjectDetails?.module_view}
              />
            </FiltersDropdown>

            {canUserCreateIssue && (
              <>
                <Button onClick={() => setAnalyticsModal(true)} variant="neutral-primary" size="sm">
                  Analytics
                </Button>
                {!isCompletedCycle && (
                  <Button
                    onClick={() => {
                      setTrackElement("Cycle issues page");
                      toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
                    }}
                    size="sm"
                  >
                    Add Issue
                  </Button>
                )}
              </>
            )}
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80"
              onClick={toggleSidebar}
            >
              <ArrowRight className={`h-4 w-4 duration-300 ${isSidebarCollapsed ? "-rotate-180" : ""}`} />
            </button>
          </div>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80 md:hidden"
            onClick={toggleSidebar}
          >
            <PanelRight className={cn("h-4 w-4", !isSidebarCollapsed ? "text-[#3E63DD]" : "text-custom-text-200")} />
          </button>
        </div>
      </div>
    </>
  );
});
