"use client";

import { useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { Lock } from "lucide-react";
// plane constants
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  EUserPermissions,
  EUserPermissionsLevel,
  EProjectFeatureKey,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@plane/constants";
// types
import { Button } from "@plane/propel/button";
import { ViewsIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { ICustomSearchSelectOption, IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssuesStoreType, EViewAccess, EIssueLayoutTypes } from "@plane/types";
// ui
import { Breadcrumbs, Header, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
// components
import { SwitcherIcon, SwitcherLabel } from "@/components/common/switcher-label";
import { DisplayFiltersSelection, FiltersDropdown, LayoutSelection } from "@/components/issues/issue-layouts/filters";
// constants
import { ViewQuickActions } from "@/components/views/quick-actions";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUserPermissions } from "@/hooks/store/user";
// plane web
import { useAppRouter } from "@/hooks/use-app-router";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

type Props = {
  workspaceSlug: string;
  projectId: string;
  viewId: string;
};

export const ProjectViewIssuesHeader: React.FC<Props> = observer(({ workspaceSlug, projectId, viewId }) => {
  // refs
  const parentRef = useRef(null);
  // router
  const router = useAppRouter();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const { currentProjectDetails, loader } = useProject();
  const { projectViewIds, getViewById } = useProjectView();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const viewDetails = getViewById(viewId);

  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (!viewDetails) return;

  const switcherOptions = projectViewIds
    ?.map((id) => {
      const _view = id === viewId ? viewDetails : getViewById(id);
      if (!_view) return;
      return {
        value: _view.id,
        query: _view.name,
        content: <SwitcherLabel logo_props={_view.logo_props} name={_view.name} LabelIcon={ViewsIcon} />,
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            featureKey={EProjectFeatureKey.VIEWS}
          />

          <Breadcrumbs.Item
            component={
              <BreadcrumbNavigationSearchDropdown
                selectedItem={viewId}
                navigationItems={switcherOptions}
                onChange={(value: string) => {
                  router.push(`/${workspaceSlug}/projects/${projectId}/views/${value}`);
                }}
                title={viewDetails?.name}
                icon={
                  <Breadcrumbs.Icon>
                    <SwitcherIcon logo_props={viewDetails.logo_props} LabelIcon={ViewsIcon} size={16} />
                  </Breadcrumbs.Icon>
                }
                isLast
              />
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
      </Header.LeftItem>
      <Header.RightItem className="items-center">
        <>
          {!viewDetails.is_locked && (
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
          )}
          {viewId && <WorkItemFiltersToggle entityType={EIssuesStoreType.PROJECT_VIEW} entityId={viewId} />}
          {!viewDetails.is_locked && (
            <FiltersDropdown title="Display" placement="bottom-end">
              <DisplayFiltersSelection
                layoutDisplayFiltersOptions={
                  activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[activeLayout] : undefined
                }
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFiltersUpdate={handleDisplayFilters}
                displayProperties={issueFilters?.displayProperties ?? {}}
                handleDisplayPropertiesUpdate={handleDisplayProperties}
                cycleViewDisabled={!currentProjectDetails?.cycle_view}
                moduleViewDisabled={!currentProjectDetails?.module_view}
              />
            </FiltersDropdown>
          )}
        </>
        {canUserCreateIssue ? (
          <Button
            onClick={() => {
              toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
            }}
            data-ph-element={WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_BUTTON.PROJECT_VIEW}
            size="sm"
          >
            Add work item
          </Button>
        ) : (
          <></>
        )}
        <div className="hidden md:block">
          <ViewQuickActions
            parentRef={parentRef}
            customClassName="flex-shrink-0 flex items-center justify-center size-[26px] bg-custom-background-80/70 rounded"
            projectId={projectId}
            view={viewDetails}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </Header.RightItem>
    </Header>
  );
});
