/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { E_FEATURE_FLAGS, EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Badge } from "@plane/propel/badge";
import { LockIcon, ViewsIcon, LockKeyHoleIcon, UnlockKeyHoleIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  ICustomSearchSelectOption,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  ILayoutDisplayFiltersOptions,
} from "@plane/types";
import { EIssuesStoreType, EViewAccess, EIssueLayoutTypes } from "@plane/types";
import { Breadcrumbs, Header, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
import { getErrorMessage } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherIcon, SwitcherLabel } from "@/components/common/switcher-label";
import { DisplayFiltersSelection, FiltersDropdown, LayoutSelection } from "@/components/issues/issue-layouts/filters";
import { ViewQuickActions } from "@/components/views/quick-actions";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
// hooks
import { usePlatformOS } from "@plane/hooks";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useFlag } from "@/plane-web/hooks/store";
// plane web imports
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";

type ProjectViewIssuesHeaderProps = {
  workspaceSlug: string;
  projectId: string;
  viewId: string;
};

export const ProjectViewIssuesHeader = observer(function ProjectViewIssuesHeader(props: ProjectViewIssuesHeaderProps) {
  const { workspaceSlug, projectId, viewId } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useAppRouter();
  // store hooks
  const {
    permissions: workItemPermissions,
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { data: currentUser } = useUser();
  const { currentProjectDetails, loader } = useProject();
  const { projectViewIds, getViewById, lockView, unLockView } = useProjectView();
  const { isMobile } = usePlatformOS();

  // derived values
  const viewDetails = getViewById(viewId);

  const workItemsCount = viewDetails?.total_work_items;
  const activeLayout = issueFilters?.displayFilters?.layout as EIssueLayoutTypes | undefined;
  const layoutDisplayFiltersOptions = activeLayout
    ? (ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions as Record<EIssueLayoutTypes, ILayoutDisplayFiltersOptions>)[
        activeLayout
      ]
    : undefined;

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      void updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      void updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      void updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const isViewLockEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.VIEW_LOCK);
  const isOwner = viewDetails?.owned_by === currentUser?.id;
  const shouldShowLockToggle = isViewLockEnabled && isOwner;

  const handleToggleViewLock = useCallback(async () => {
    if (!shouldShowLockToggle || !viewDetails || isTogglingLock) return;

    setIsTogglingLock(true);
    try {
      const operation = viewDetails.is_locked ? unLockView : lockView;
      await operation(workspaceSlug, projectId, viewId);
    } catch (error) {
      const defaultMessage = viewDetails.is_locked
        ? "View could not be unlocked. Please try again later."
        : "View could not be locked. Please try again later.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: getErrorMessage(error, defaultMessage),
      });
    } finally {
      setIsTogglingLock(false);
    }
  }, [isTogglingLock, lockView, projectId, shouldShowLockToggle, unLockView, viewDetails, viewId, workspaceSlug]);
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

  if (!viewDetails) return null;

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2">
          <Breadcrumbs isLoading={loader === "init-loader"} className="grow-0">
            <ProjectBreadcrumbWithPreference workspaceSlug={workspaceSlug} projectId={projectId} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Views"
                  href={`/${workspaceSlug}/projects/${projectId}/views/`}
                  icon={<ViewsIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbNavigationSearchDropdown
                  selectedItem={viewId ?? ""}
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
                  suffix={
                    workItemsCount != null && workItemsCount > 0 ? (
                      <Tooltip
                        isMobile={isMobile}
                        tooltipContent={`There are ${workItemsCount} ${
                          workItemsCount > 1 ? "work items" : "work item"
                        } in this view`}
                        position="bottom"
                      >
                        <span className="flex shrink-0 cursor-default items-center justify-center rounded-xl bg-accent-primary/20 px-2 text-center text-11 font-semibold text-accent-primary">
                          {workItemsCount}
                        </span>
                      </Tooltip>
                    ) : null
                  }
                  isLast
                />
              }
            />
          </Breadcrumbs>
          {viewDetails?.access === EViewAccess.PRIVATE ? (
            <Badge variant="neutral">
              <LockIcon className="size-3.5" />
              Private
            </Badge>
          ) : (
            <></>
          )}
        </div>
      </Header.LeftItem>
      <Header.RightItem className="items-center">
        {shouldShowLockToggle && (
          <Button
            variant={"secondary"}
            prependIcon={
              viewDetails.is_locked ? (
                <UnlockKeyHoleIcon className="size-3.5" />
              ) : (
                <LockKeyHoleIcon className="size-3.5" />
              )
            }
            onClick={() => void handleToggleViewLock()}
            disabled={isTogglingLock}
            loading={isTogglingLock}
          >
            {viewDetails.is_locked ? "Unlock" : "Lock"}
          </Button>
        )}

        {!viewDetails.is_locked && (
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
            {viewId && <WorkItemFiltersToggle enablePQL entityType={EIssuesStoreType.PROJECT_VIEW} entityId={viewId} />}
            <FiltersDropdown title="Display" placement="bottom-end">
              <DisplayFiltersSelection
                layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
                workItemFilters={issueFilters}
                handleDisplayFiltersUpdate={handleDisplayFilters}
                handleDisplayPropertiesUpdate={handleDisplayProperties}
                cycleViewDisabled={!currentProjectDetails?.cycle_view}
                moduleViewDisabled={!currentProjectDetails?.module_view}
              />
            </FiltersDropdown>
            {workItemPermissions.getCanCreate(workspaceSlug, projectId) && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
                }}
              >
                Add work item
              </Button>
            )}
            <div className="hidden md:block">
              <ViewQuickActions
                parentRef={parentRef}
                customClassName="shrink-0 flex items-center justify-center size-[26px] bg-layer-1/70 rounded-sm"
                projectId={projectId}
                view={viewDetails}
                workspaceSlug={workspaceSlug}
                isDetailPage
              />
            </div>
          </>
        )}
      </Header.RightItem>
    </Header>
  );
});
