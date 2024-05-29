import { useCallback } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
// ui
import { Breadcrumbs, Button, CustomMenu, PhotoFilterIcon } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
// constants
import { EIssuesStoreType, EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
import { truncateText } from "@/helpers/string.helper";
// hooks
import {
  useCommandPalette,
  useEventTracker,
  useIssues,
  useLabel,
  useMember,
  useProject,
  useProjectState,
  useProjectView,
  useUser,
} from "@/hooks/store";

export const ProjectViewIssuesHeader: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { setTrackElement } = useEventTracker();
  const { toggleCreateIssueModal } = useCommandPalette();
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
      if (!workspaceSlug || !projectId || !viewId) return;
      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.DISPLAY_FILTERS,
        { layout: layout },
        viewId.toString()
      );
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId || !viewId) return;
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

      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        { [key]: newValues },
        viewId.toString()
      );
    },
    [workspaceSlug, projectId, viewId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId || !viewId) return;
      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.DISPLAY_FILTERS,
        updatedDisplayFilter,
        viewId.toString()
      );
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId || !viewId) return;
      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.DISPLAY_PROPERTIES,
        property,
        viewId.toString()
      );
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const viewDetails = viewId ? getViewById(viewId.toString()) : null;

  const canUserCreateIssue =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  const isFiltersApplied = calculateTotalFilters(issueFilters?.filters ?? {}) !== 0;

  return (
    <div className="relative z-[15] flex h-[3.75rem] w-full items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2">
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                label={currentProjectDetails?.name ?? "Project"}
                icon={
                  currentProjectDetails && (
                    <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                      <Logo logo={currentProjectDetails?.logo_props} size={16} />
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
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/views`}
                label="Views"
                icon={<PhotoFilterIcon className="h-4 w-4 text-custom-text-300" />}
              />
            }
          />
          <Breadcrumbs.BreadcrumbItem
            type="component"
            component={
              <CustomMenu
                label={
                  <>
                    {viewDetails?.logo_props?.in_use ? (
                      <Logo logo={viewDetails.logo_props} size={12} type="lucide" />
                    ) : (
                      <PhotoFilterIcon height={12} width={12} />
                    )}
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
                        {view?.logo_props?.in_use ? (
                          <Logo logo={view.logo_props} size={12} type="lucide" />
                        ) : (
                          <PhotoFilterIcon height={12} width={12} />
                        )}
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

        <FiltersDropdown
          title="Filters"
          placement="bottom-end"
          disabled={!canUserCreateIssue}
          isFiltersApplied={isFiltersApplied}
        >
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
        {canUserCreateIssue && (
          <Button
            onClick={() => {
              setTrackElement("PROJECT_VIEW_PAGE_HEADER");
              toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
            }}
            size="sm"
          >
            Add Issue
          </Button>
        )}
      </div>
    </div>
  );
});
