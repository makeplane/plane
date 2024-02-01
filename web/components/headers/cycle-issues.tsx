import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import Link from "next/link";
// hooks
import {
  useApplication,
  useCycle,
  useLabel,
  useMember,
  useProject,
  useProjectState,
  useUser,
  useIssues,
} from "hooks/store";
import useLocalStorage from "hooks/use-local-storage";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
import { ProjectAnalyticsModal } from "components/analytics";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";
// ui
import { Breadcrumbs, Button, ContrastIcon, CustomMenu } from "@plane/ui";
// icons
import { ArrowRight, Plus } from "lucide-react";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
// constants
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
import { EUserProjectRoles } from "constants/project";

const CycleDropdownOption: React.FC<{ cycleId: string }> = ({ cycleId }) => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { getCycleById } = useCycle();
  // derived values
  const cycle = getCycleById(cycleId);

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
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCycleIds, getCycleById } = useCycle();
  const {
    commandPalette: { toggleCreateIssueModal },
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const { setValue, storedValue } = useLocalStorage("cycle_sidebar_collapsed", "false");

  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
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
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
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
  const canUserCreateIssue =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        cycleDetails={cycleDetails ?? undefined}
      />
      <div className="relative z-10 flex h-[3.75rem] w-full items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div className="flex items-center gap-2">
          <SidebarHamburgerToggle />
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={currentProjectDetails?.name ?? "Project"}
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                  icon={
                    currentProjectDetails?.emoji ? (
                      renderEmoji(currentProjectDetails.emoji)
                    ) : currentProjectDetails?.icon_prop ? (
                      renderEmoji(currentProjectDetails.icon_prop)
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-gray-700 uppercase text-white">
                        {currentProjectDetails?.name.charAt(0)}
                      </span>
                    )
                  }
                />
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
                      {cycleDetails?.name && truncateText(cycleDetails.name, 40)}
                    </>
                  }
                  className="ml-1.5 flex-shrink-0"
                  placement="bottom-start"
                >
                  {currentProjectCycleIds?.map((cycleId) => (
                    <CycleDropdownOption key={cycleId} cycleId={cycleId} />
                  ))}
                </CustomMenu>
              }
            />
          </Breadcrumbs>
        </div>
        <div className="flex items-center gap-2">
          <LayoutSelection
            layouts={["list", "kanban", "calendar", "spreadsheet", "gantt_chart"]}
            onChange={(layout) => handleLayoutChange(layout)}
            selectedLayout={activeLayout}
          />
          <FiltersDropdown title="Filters" placement="bottom-end">
            <FilterSelection
              filters={issueFilters?.filters ?? {}}
              handleFiltersUpdate={handleFiltersUpdate}
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              labels={projectLabels}
              memberIds={projectMemberIds ?? undefined}
              states={projectStates}
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
            />
          </FiltersDropdown>

          {canUserCreateIssue && (
            <>
              <Button onClick={() => setAnalyticsModal(true)} variant="neutral-primary" size="sm">
                Analytics
              </Button>
              <Button
                onClick={() => {
                  setTrackElement("CYCLE_PAGE_HEADER");
                  toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
                }}
                size="sm"
                prependIcon={<Plus />}
              >
                Add Issue
              </Button>
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
      </div>
    </>
  );
});
