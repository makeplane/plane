import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Briefcase, Circle, ExternalLink, Plus } from "lucide-react";
// hooks
import {
  useApplication,
  useEventTracker,
  useLabel,
  useProject,
  useProjectState,
  useUser,
  useMember,
} from "hooks/store";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
import { ProjectAnalyticsModal } from "components/analytics";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";
// ui
import { Breadcrumbs, Button, LayersIcon } from "@plane/ui";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
// constants
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
// helper
import { renderEmoji } from "helpers/emoji.helper";
import { EUserProjectRoles } from "constants/project";
import { useIssues } from "hooks/store/use-issues";
import { IssuesMobileHeader } from "components/issues/issues-mobile-header";

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
  } = useIssues(EIssuesStoreType.PROJECT);
  const {
    commandPalette: { toggleCreateIssueModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();

  const activeLayout = issueFilters?.displayFilters?.layout;

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

  const deployUrl = process.env.NEXT_PUBLIC_DEPLOY_URL;
  const canUserCreateIssue =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        projectDetails={currentProjectDetails ?? undefined}
      />
      <div className="relative z-[15] items-center gap-x-2 gap-y-4">
        <div className="flex items-center gap-2 p-4 border-b border-custom-border-200 bg-custom-sidebar-background-100">
          <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
            <SidebarHamburgerToggle />
            <div>
              <Breadcrumbs onBack={() => router.back()}>
                <Breadcrumbs.BreadcrumbItem
                  type="text"
                  link={
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/projects`}
                      label={currentProjectDetails?.name ?? "Project"}
                      icon={
                        currentProjectDetails ? (
                          currentProjectDetails?.emoji ? (
                            <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                              {renderEmoji(currentProjectDetails.emoji)}
                            </span>
                          ) : currentProjectDetails?.icon_prop ? (
                            <div className="grid h-7 w-7 flex-shrink-0 place-items-center">
                              {renderEmoji(currentProjectDetails.icon_prop)}
                            </div>
                          ) : (
                            <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                              {currentProjectDetails?.name.charAt(0)}
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
                  link={
                    <BreadcrumbLink label="Issues" icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />} />
                  }
                />
              </Breadcrumbs>
            </div>
            {currentProjectDetails?.is_deployed && deployUrl && (
              <a
                href={`${deployUrl}/${workspaceSlug}/${currentProjectDetails?.id}`}
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
                prependIcon={<Plus />}
              >
                <div className="hidden sm:block">Add</div> Issue
              </Button>
            </>
          )}
        </div>
        <div className="block md:hidden">
          <IssuesMobileHeader />
        </div>
      </div>
    </>
  );
});
