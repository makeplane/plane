/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { BarOutline, CyclesOutline, PreferencesOutline, RightSidePaneOutline } from "@makeplane/propel/icons";
// plane imports
import {
  CYCLE_STATUS,
  EIssueFilterType,
  EUserPermissions,
  EUserPermissionsLevel,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
} from "@plane/constants";
import { usePlatformOS } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, TCycleGroups } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
// components
import { WorkItemsModal } from "@/components/analytics/work-items/modal";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CycleQuickActions } from "@/components/cycles/quick-actions";
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
import {
  DisplayFiltersSelection,
  FiltersDropdown,
  LayoutSelection,
  MobileLayoutSelection,
} from "@/components/issues/issue-layouts/filters";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import useLocalStorage from "@/hooks/use-local-storage";
// plane web imports
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { useProjectCrumbProps } from "@/components/breadcrumbs/use-project-crumb-props";

/** The breadcrumb switcher offers every cycle of the project, completed ones included. */
const ALL_CYCLE_STATUSES: TCycleGroups[] = CYCLE_STATUS.map((status) => status.value);

export const CycleIssuesHeader = observer(function CycleIssuesHeader() {
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, cycleId } = useParams();
  const projectCrumb = useProjectCrumbProps(workspaceSlug?.toString(), projectId?.toString());
  // i18n
  const { t } = useTranslation();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { getCycleById } = useCycle();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { currentProjectDetails, loader } = useProject();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const { setValue, storedValue } = useLocalStorage("cycle_sidebar_collapsed", false);

  const isSidebarCollapsed = storedValue === true;
  const toggleSidebar = () => {
    setValue(!isSidebarCollapsed);
  };

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, cycleId);
    },
    [workspaceSlug, projectId, cycleId, updateFilters]
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
  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const workItemsCount = getGroupIssueCount(undefined, undefined, false);

  return (
    <>
      <WorkItemsModal
        projectDetails={currentProjectDetails}
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        cycleDetails={cycleDetails ?? undefined}
      />
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2">
            <Breadcrumbs isLoading={loader === "init-loader"}>
              <CommonProjectBreadcrumbs
                workspaceSlug={workspaceSlug?.toString()}
                projectId={projectId?.toString()}
                {...projectCrumb}
              />
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    label="Cycles"
                    href={`/${workspaceSlug}/projects/${projectId}/cycles/`}
                    icon={<CyclesOutline className="h-4 w-4 text-tertiary" />}
                  />
                }
              />
              <Breadcrumbs.Item
                component={
                  <CycleSelect
                    projectId={projectId?.toString()}
                    value={cycleId?.toString()}
                    onChange={(id) => {
                      if (id) router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${id}`);
                    }}
                    variant="breadcrumb"
                    placeholder={cycleDetails?.name}
                    status={ALL_CYCLE_STATUSES}
                    clearable={false}
                  />
                }
                isLast
              />
            </Breadcrumbs>
            {workItemsCount && workItemsCount > 0 ? (
              <Tooltip
                label={`There are ${workItemsCount} ${workItemsCount > 1 ? "work items" : "work item"} in this cycle`}
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
          <div className="hidden items-center gap-2 md:flex">
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
            <WorkItemFiltersToggle entityType={EIssuesStoreType.CYCLE} entityId={cycleId} />
            <FiltersDropdown
              title={t("common.display")}
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
                ignoreGroupedFilters={["cycle"]}
                cycleViewDisabled={!currentProjectDetails?.cycle_view}
                moduleViewDisabled={!currentProjectDetails?.module_view}
              />
            </FiltersDropdown>

            {canUserCreateIssue && (
              <>
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
                {!isCompletedCycle && (
                  <Button
                    variant="primary"
                    size="md"
                    stretch="auto"
                    label={t("issue.add.label")}
                    onClick={() => {
                      toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
                    }}
                  />
                )}
              </>
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
            <CycleQuickActions
              parentRef={parentRef}
              cycleId={cycleId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              customClassName="flex-shrink-0 flex items-center justify-center size-[26px] bg-layer-1/70 rounded-sm"
            />
          </div>
        </Header.RightItem>
      </Header>
    </>
  );
});
