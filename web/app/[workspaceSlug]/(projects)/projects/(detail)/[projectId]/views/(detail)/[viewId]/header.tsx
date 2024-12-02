"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Layers, Lock } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
// ui
import { Breadcrumbs, Button, CustomMenu, Tooltip, Header } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
// constants
import {
  EIssuesStoreType,
  EIssueFilterType,
  EIssueLayoutTypes,
  ISSUE_DISPLAY_FILTERS_BY_LAYOUT,
} from "@/constants/issue";
import { EViewAccess } from "@/constants/views";
// helpers
import { isIssueFilterActive } from "@/helpers/filter.helper";
import { getPublishViewLink } from "@/helpers/project-views.helpers";
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
  useUserPermissions,
} from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const ProjectViewIssuesHeader: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId, viewId } = useParams();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { setTrackElement } = useEventTracker();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const { currentProjectDetails, loader } = useProject();
  const { projectViewIds, getViewById } = useProjectView();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
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

  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const publishLink = getPublishViewLink(viewDetails?.anchor);

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader}>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
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
                icon={<Layers className="h-4 w-4 text-custom-text-300" />}
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
                      <Layers height={12} width={12} />
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
                          <Layers height={12} width={12} />
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

        {viewDetails?.access === EViewAccess.PRIVATE ? (
          <div className="cursor-default text-custom-text-300">
            <Tooltip tooltipContent={"Private"}>
              <Lock className="h-4 w-4" />
            </Tooltip>
          </div>
        ) : (
          <></>
        )}

        {viewDetails?.anchor && publishLink ? (
          <a
            href={publishLink}
            className="px-3 py-1.5 bg-green-500/20 text-green-500 rounded text-xs font-medium flex items-center gap-1.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="flex-shrink-0 rounded-full size-1.5 bg-green-500" />
            Live
          </a>
        ) : (
          <></>
        )}
      </Header.LeftItem>
      <Header.RightItem>
        {!viewDetails?.is_locked ? (
          <>
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
              disabled={!canUserCreateIssue}
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
                cycleViewDisabled={!currentProjectDetails?.cycle_view}
                moduleViewDisabled={!currentProjectDetails?.module_view}
              />
            </FiltersDropdown>
          </>
        ) : (
          <></>
        )}
        {canUserCreateIssue ? (
          <Button
            onClick={() => {
              setTrackElement("PROJECT_VIEW_PAGE_HEADER");
              toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
            }}
            size="sm"
          >
            Add issue
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
