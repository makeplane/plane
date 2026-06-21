/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChartNoAxesColumn } from "lucide-react";
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  type TFiltersLayoutOptions,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CycleIcon, WorkItemsIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
import { getComputedDisplayProperties } from "@plane/utils";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CountChip } from "@/components/common/count-chip";
import { WorkItemsModal } from "@/components/analytics/work-items/modal";
import {
  DisplayFiltersSelection,
  FiltersDropdown,
  LayoutSelection,
  MobileLayoutSelection,
} from "@/components/issues/issue-layouts/filters";
import { WorkItemsMeModeToggle } from "@/components/issues/me-mode-toggle";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

const SPRINT_VIEW_ID = "all-issues";
const SPRINT_LAYOUTS = [
  EIssueLayoutTypes.LIST,
  EIssueLayoutTypes.KANBAN,
  EIssueLayoutTypes.CALENDAR,
  EIssueLayoutTypes.SPREADSHEET,
  EIssueLayoutTypes.GANTT,
];
const SPRINT_DISPLAY_FILTERS_BY_LAYOUT: TFiltersLayoutOptions = {
  ...ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions,
  list: {
    ...ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions.list,
    display_filters: {
      ...ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions.list.display_filters,
      group_by: ["state_detail.group", "priority", "project", "labels", "assignees", "created_by", null],
    },
  },
  kanban: {
    ...ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions.kanban,
    display_filters: {
      ...ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions.kanban.display_filters,
      group_by: ["state_detail.group", "priority", "project", "labels", "assignees", "created_by"],
      sub_group_by: ["state_detail.group", "priority", "project", "labels", "assignees", "created_by", null],
    },
  },
};

const formatSprintWeek = (startDate: string | null, endDate: string | null) => {
  if (!startDate && !endDate) return undefined;

  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  const start = startDate ? formatter.format(new Date(startDate)) : "No start";
  const end = endDate ? formatter.format(new Date(endDate)) : "No end";

  return `${start} - ${end}`;
};

export const WorkspaceSprintsHeader = observer(function WorkspaceSprintsHeader() {
  const router = useAppRouter();
  const { workspaceSlug, workspaceSprintId } = useParams();
  const sprintId = workspaceSprintId?.toString();
  const workspaceSlugValue = workspaceSlug?.toString();
  const { fetchWorkspaceSprints, getSprintById } = useWorkspaceSprint();

  const sprint = getSprintById(sprintId);
  const sprintWeek = sprint ? formatSprintWeek(sprint.start_date, sprint.end_date) : undefined;

  useEffect(() => {
    if (workspaceSlugValue) fetchWorkspaceSprints(workspaceSlugValue);
  }, [fetchWorkspaceSprints, workspaceSlugValue]);

  return (
    <>
      <Header className="h-full overflow-hidden">
        <Header.LeftItem className="h-full max-w-full flex-nowrap gap-3 overflow-hidden">
          <Breadcrumbs onBack={() => router.back()} className="min-w-0 flex-grow-0">
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Squads"
                  href={`/${workspaceSlugValue}/sprints`}
                  icon={<CycleIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={sprintId ? (sprint?.name ?? "Sprint") : "Manage squads"}
                  icon={<WorkItemsIcon className="h-4 w-4 text-tertiary" />}
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>
          {sprintWeek && <span className="shrink-0 text-11 text-tertiary">{sprintWeek}</span>}
        </Header.LeftItem>
        <Header.RightItem className="shrink-0 items-center">
          <WorkspaceSprintsHeaderActions />
        </Header.RightItem>
      </Header>
    </>
  );
});

export const WorkspaceSprintsHeaderActions = observer(function WorkspaceSprintsHeaderActions() {
  const { workspaceSlug, workspaceSprintId } = useParams();
  const sprintId = workspaceSprintId?.toString();
  const workspaceSlugValue = workspaceSlug?.toString();
  const { t } = useTranslation();
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const { isMobile } = usePlatformOS();

  const {
    issuesFilter: { filters, updateFilters },
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { getSprintById } = useWorkspaceSprint();

  const issueFilters = filters[SPRINT_VIEW_ID];
  const sprint = sprintId ? getSprintById(sprintId) : undefined;
  const activeLayout = issueFilters?.displayFilters?.layout;
  const workItemsCount = getGroupIssueCount(undefined, undefined, false);
  const displayProperties = {
    ...getComputedDisplayProperties(issueFilters?.displayProperties),
    project: issueFilters?.displayProperties?.project ?? true,
    sprint: false,
  };

  const currentLayoutFilters = useMemo(() => {
    const layout = activeLayout ?? EIssueLayoutTypes.SPREADSHEET;
    const layoutFilters = SPRINT_DISPLAY_FILTERS_BY_LAYOUT[layout];

    if (!sprintId || !layoutFilters?.display_properties) return layoutFilters;

    return {
      ...layoutFilters,
      display_properties: layoutFilters.display_properties.filter((property) => property !== "sprint"),
    };
  }, [activeLayout, sprintId]);

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlugValue) return;
      updateFilters(
        workspaceSlugValue,
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        updatedDisplayFilter,
        SPRINT_VIEW_ID
      );
    },
    [updateFilters, workspaceSlugValue]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlugValue) return;
      const nextDisplayProperties = {
        ...getComputedDisplayProperties(issueFilters?.displayProperties),
        project: issueFilters?.displayProperties?.project ?? true,
        sprint: false,
        ...property,
      };

      updateFilters(
        workspaceSlugValue,
        undefined,
        EIssueFilterType.DISPLAY_PROPERTIES,
        nextDisplayProperties,
        SPRINT_VIEW_ID
      );
    },
    [issueFilters?.displayProperties, updateFilters, workspaceSlugValue]
  );

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlugValue) return;
      const nextDisplayFilters: Partial<IIssueDisplayFilterOptions> = { layout };

      if (layout === EIssueLayoutTypes.KANBAN && !issueFilters?.displayFilters?.group_by) {
        nextDisplayFilters.group_by = "state_detail.group";
      }

      updateFilters(
        workspaceSlugValue,
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        nextDisplayFilters,
        SPRINT_VIEW_ID
      );
    },
    [issueFilters?.displayFilters?.group_by, updateFilters, workspaceSlugValue]
  );

  if (!sprintId || !workspaceSlugValue || !issueFilters) return null;

  return (
    <>
      <WorkItemsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        workspaceSprintDetails={sprint}
      />
      {workItemsCount && workItemsCount > 0 ? (
        <Tooltip
          isMobile={isMobile}
          tooltipContent={`There are ${workItemsCount} ${
            workItemsCount > 1 ? "work items" : "work item"
          } in this sprint`}
          position="bottom"
        >
          <CountChip count={workItemsCount} />
        </Tooltip>
      ) : null}
      <div className="hidden @4xl:flex">
        <LayoutSelection
          layouts={SPRINT_LAYOUTS}
          onChange={handleLayoutChange}
          selectedLayout={activeLayout ?? EIssueLayoutTypes.SPREADSHEET}
        />
      </div>
      <div className="flex @4xl:hidden">
        <MobileLayoutSelection
          layouts={SPRINT_LAYOUTS}
          onChange={handleLayoutChange}
          activeLayout={activeLayout ?? EIssueLayoutTypes.SPREADSHEET}
        />
      </div>
      <WorkItemFiltersToggle entityType={EIssuesStoreType.GLOBAL} entityId={SPRINT_VIEW_ID} />
      <WorkItemsMeModeToggle
        displayFilters={issueFilters?.displayFilters}
        handleDisplayFiltersUpdate={handleDisplayFilters}
      />
      <FiltersDropdown title={t("common.display")} placement="bottom-end">
        <DisplayFiltersSelection
          layoutDisplayFiltersOptions={currentLayoutFilters}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
          displayProperties={displayProperties}
          handleDisplayPropertiesUpdate={handleDisplayProperties}
        />
      </FiltersDropdown>
      <Button onClick={() => setAnalyticsModal(true)} variant="secondary" size="lg">
        <span className="hidden @4xl:flex">{t("common.analytics")}</span>
        <span className="@4xl:hidden">
          <ChartNoAxesColumn className="size-3.5" />
        </span>
      </Button>
      <Button
        variant="primary"
        size="lg"
        data-ph-element={WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_BUTTON.WORK_ITEMS}
        onClick={() => {
          toggleCreateIssueModal(true);
        }}
      >
        {t("issue.add.label")}
      </Button>
    </>
  );
});
