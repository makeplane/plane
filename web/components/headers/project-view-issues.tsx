import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
import Link from "next/link";
// hooks
import {
  useApplication,
  useIssues,
  useLabel,
  useMember,
  useProject,
  useProjectState,
  useProjectView,
  useUser,
} from "hooks/store";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
// ui
import { Breadcrumbs, Button, CustomMenu, PhotoFilterIcon } from "@plane/ui";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
// constants
import { EIssuesStoreType, EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
import { EUserProjectRoles } from "constants/project";

export const ProjectViewIssuesHeader: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    viewId: string;
  };
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const {
    commandPalette: { toggleCreateIssueModal },
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  const { projectViewIds, getViewById } = useProjectView();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
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

      updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { [key]: newValues }, viewId);
    },
    [workspaceSlug, projectId, viewId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const viewDetails = viewId ? getViewById(viewId.toString()) : null;

  const canUserCreateIssue =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2">
        <SidebarHamburgerToggle />
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            label={currentProjectDetails?.name ?? "Project"}
            icon={
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
            }
            link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
          />
          <Breadcrumbs.BreadcrumbItem
            type="text"
            icon={<PhotoFilterIcon className="h-4 w-4 text-custom-text-300" />}
            label="Views"
            link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/views`}
          />
          <Breadcrumbs.BreadcrumbItem
            type="component"
            component={
              <CustomMenu
                label={
                  <>
                    <PhotoFilterIcon height={12} width={12} />
                    {viewDetails?.name && truncateText(viewDetails.name, 40)}
                  </>
                }
                className="ml-1.5"
                placement="bottom-start"
              >
                {projectViewIds?.map((viewId) => {
                  const view = getViewById(viewId);

                  if (!view) return;

                  return (
                    <CustomMenu.MenuItem key={viewId}>
                      <Link
                        href={`/${workspaceSlug}/projects/${projectId}/views/${viewId}`}
                        className="flex items-center gap-1.5"
                      >
                        <PhotoFilterIcon height={12} width={12} />
                        {truncateText(view.name, 40)}
                      </Link>
                    </CustomMenu.MenuItem>
                  );
                })}
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

        <FiltersDropdown title="Filters" placement="bottom-end" disabled={!canUserCreateIssue}>
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
          <Button
            onClick={() => {
              setTrackElement("PROJECT_VIEW_PAGE_HEADER");
              toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
            }}
            size="sm"
            prependIcon={<Plus />}
          >
            Add Issue
          </Button>
        )}
      </div>
    </div>
  );
});
