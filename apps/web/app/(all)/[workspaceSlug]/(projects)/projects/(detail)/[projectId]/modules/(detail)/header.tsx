/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { BarOutline, ModuleOutline, PreferencesOutline, RightSidePaneOutline } from "@makeplane/propel/icons";
// plane imports
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  EUserPermissions,
  EUserPermissionsLevel,
} from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
// components
import { WorkItemsModal } from "@/components/analytics/work-items/modal";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
import {
  DisplayFiltersSelection,
  FiltersDropdown,
  LayoutSelection,
  MobileLayoutSelection,
} from "@/components/issues/issue-layouts/filters";
import { ModuleQuickActions } from "@/components/modules";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import useLocalStorage from "@/hooks/use-local-storage";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";

export const ModuleIssuesHeader = observer(function ModuleIssuesHeader() {
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, moduleId: routerModuleId } = useParams();
  const moduleId = routerModuleId ? routerModuleId.toString() : undefined;
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    issuesFilter: { issueFilters },
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.MODULE);
  const { updateFilters } = useIssuesActions(EIssuesStoreType.MODULE);
  const { getModuleById } = useModule();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();
  // local storage
  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");
  // derived values
  const isSidebarCollapsed = storedValue ? storedValue === "true" : false;
  const activeLayout = issueFilters?.displayFilters?.layout;
  const moduleDetails = moduleId ? getModuleById(moduleId) : undefined;
  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const workItemsCount = getGroupIssueCount(undefined, undefined, false);

  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [projectId, updateFilters]
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

  return (
    <>
      <WorkItemsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        moduleDetails={moduleDetails ?? undefined}
        projectDetails={currentProjectDetails}
      />
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2">
            <Breadcrumbs isLoading={loader === "init-loader"}>
              <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    label="Modules"
                    href={`/${workspaceSlug}/projects/${projectId}/modules/`}
                    icon={<ModuleOutline className="h-4 w-4 text-tertiary" />}
                    isLast
                  />
                }
                isLast
              />
              <Breadcrumbs.Item
                component={
                  <ModuleSelect
                    projectId={projectId?.toString()}
                    value={moduleId ?? null}
                    onChange={(id) => {
                      if (id) router.push(`/${workspaceSlug}/projects/${projectId}/modules/${id}`);
                    }}
                    variant="breadcrumb"
                    placeholder={moduleDetails?.name}
                  />
                }
                isLast
              />
            </Breadcrumbs>
            {workItemsCount && workItemsCount > 0 ? (
              <Tooltip
                label={`There are ${workItemsCount} ${workItemsCount > 1 ? "work items" : "work item"} in this module`}
                layout="stacked"
                side="bottom"
                disabled={isMobile}
              >
                <span className="flex flex-shrink-0 cursor-default items-center justify-center rounded-xl bg-accent-primary/20 px-2 text-center text-11 font-semibold text-accent-primary">
                  {workItemsCount}
                </span>
              </Tooltip>
            ) : null}
          </div>
        </Header.LeftItem>
        <Header.RightItem className="items-center">
          <div className="hidden gap-2 md:flex">
            <div className="hidden @4xl:flex">
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
            </div>
            <div className="flex @4xl:hidden">
              <MobileLayoutSelection
                layouts={[
                  EIssueLayoutTypes.LIST,
                  EIssueLayoutTypes.KANBAN,
                  EIssueLayoutTypes.CALENDAR,
                  EIssueLayoutTypes.SPREADSHEET,
                  EIssueLayoutTypes.GANTT,
                ]}
                onChange={(layout) => handleLayoutChange(layout)}
                activeLayout={activeLayout}
              />
            </div>
            {moduleId && <WorkItemFiltersToggle entityType={EIssuesStoreType.MODULE} entityId={moduleId} />}
            <FiltersDropdown
              title="Display"
              placement="bottom-end"
              miniIcon={<PreferencesOutline className="size-3.5" />}
            >
              <DisplayFiltersSelection
                layoutDisplayFiltersOptions={
                  activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[activeLayout] : undefined
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
              <div className="hidden md:block">
                <span className="hidden @4xl:flex">
                  <Button
                    variant="secondary"
                    size="md"
                    stretch="auto"
                    label="Analytics"
                    onClick={() => setAnalyticsModal(true)}
                  />
                </span>
                <span className="@4xl:hidden">
                  <IconButton
                    variant="secondary"
                    size="md"
                    icon={<Icon icon={BarOutline} />}
                    aria-label="Analytics"
                    onClick={() => setAnalyticsModal(true)}
                  />
                </span>
              </div>
              <div className="hidden sm:flex">
                <Button
                  variant="primary"
                  size="md"
                  stretch="auto"
                  label="Add work item"
                  onClick={() => {
                    toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
                  }}
                />
              </div>
            </>
          ) : (
            <></>
          )}
          <IconButton
            // the open state was a bespoke accent class; it maps to the tertiary fill
            variant={isSidebarCollapsed ? "ghost" : "tertiary"}
            size="md"
            icon={<Icon icon={RightSidePaneOutline} />}
            aria-label="Toggle sidebar"
            aria-pressed={!isSidebarCollapsed}
            onClick={toggleSidebar}
          />
          {moduleId && (
            <ModuleQuickActions
              parentRef={parentRef}
              moduleId={moduleId}
              projectId={projectId.toString()}
              workspaceSlug={workspaceSlug.toString()}
              customClassName="flex-shrink-0 flex items-center justify-center bg-layer-1/70 rounded-sm size-[26px]"
            />
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
