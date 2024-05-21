import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { Briefcase, Circle, ExternalLink } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
// ui
import { Breadcrumbs, Button, LayersIcon, Tooltip } from "@plane/ui";
// components
import { ProjectAnalyticsModal } from "@/components/analytics";
import { BreadcrumbLink } from "@/components/common";
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
import { ProjectLogo } from "@/components/project";
// constants
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@/helpers/common.helper";
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import {
  useEventTracker,
  useLabel,
  useProject,
  useProjectState,
  useUser,
  useMember,
  useCommandPalette,
} from "@/hooks/store";
import { useIssues } from "@/hooks/store/use-issues";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const ProjectIssuesHeader: React.FC = observer(() => {
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };
  // store hooks
  const {
    project: { projectMemberIds },
  } = useMember();
  const {
    issuesFilter: { issueFilters, updateFilters },
    issues: { issuesCount },
  } = useIssues(EIssuesStoreType.PROJECT);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const { isMobile } = usePlatformOS();
  const activeLayout = issueFilters?.displayFilters?.layout;

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

      updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { [key]: newValues });
    },
    [workspaceSlug, projectId, issueFilters, updateFilters]
  );

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const DEPLOY_URL = SPACE_BASE_URL + SPACE_BASE_PATH;

  const canUserCreateIssue =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  const isFiltersApplied = calculateTotalFilters(issueFilters?.filters ?? {}) !== 0;

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        projectDetails={currentProjectDetails ?? undefined}
      />

      <div className="relative z-[15] flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <div className="flex items-center gap-2.5">
            <Breadcrumbs onBack={() => router.back()}>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/projects`}
                    label={currentProjectDetails?.name ?? "Project"}
                    icon={
                      currentProjectDetails ? (
                        currentProjectDetails && (
                          <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                            <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                          </span>
                        )
                      ) : (
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                          <Briefcase className="h-4 w-4" />
                        </span>
                      )
                    }
                  />
                }
              />

              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={<BreadcrumbLink label="Issues" icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />} />}
              />
            </Breadcrumbs>
            {issuesCount && issuesCount > 0 ? (
              <Tooltip
                isMobile={isMobile}
                tooltipContent={`There are ${issuesCount} ${issuesCount > 1 ? "issues" : "issue"} in this project`}
                position="bottom"
              >
                <span className="cursor-default flex items-center text-center justify-center px-2.5 py-0.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
                  {issuesCount}
                </span>
              </Tooltip>
            ) : null}
          </div>
          {currentProjectDetails?.is_deployed && DEPLOY_URL && (
            <a
              href={`${DEPLOY_URL}/${workspaceSlug}/${currentProjectDetails?.id}`}
              className="group flex items-center gap-1.5 rounded bg-custom-primary-100/10 px-2.5 py-1 text-xs font-medium text-custom-primary-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Circle className="h-1.5 w-1.5 fill-custom-primary-100" strokeWidth={2} />
              Public
              <ExternalLink className="hidden h-3 w-3 group-hover:block" strokeWidth={2} />
            </a>
          )}
        </div>
        <div className="items-center gap-2 hidden md:flex">
          <LayoutSelection
            layouts={["list", "kanban", "calendar", "spreadsheet", "gantt_chart"]}
            onChange={(layout) => handleLayoutChange(layout)}
            selectedLayout={activeLayout}
          />
          <FiltersDropdown title="Filters" placement="bottom-end" isFiltersApplied={isFiltersApplied}>
            <FilterSelection
              filters={issueFilters?.filters ?? {}}
              handleFiltersUpdate={handleFiltersUpdate}
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
              cycleViewDisabled={!currentProjectDetails?.cycle_view}
              moduleViewDisabled={!currentProjectDetails?.module_view}
            />
          </FiltersDropdown>
        </div>

        {canUserCreateIssue && (
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
              onClick={() => {
                setTrackElement("Project issues page");
                toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              }}
              size="sm"
            >
              <div className="hidden sm:block">Add</div> Issue
            </Button>
          </>
        )}
      </div>
    </>
  );
});
