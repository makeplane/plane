/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EIssueLayoutTypes } from "@plane/types";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { BaseCalendarRoot } from "@/components/issues/issue-layouts/calendar/base-calendar-root";
import { BaseGanttRoot } from "@/components/issues/issue-layouts/gantt/base-gantt-root";
import { BaseKanBanRoot } from "@/components/issues/issue-layouts/kanban/base-kanban-root";
import { BaseListRoot } from "@/components/issues/issue-layouts/list/base-list-root";
import { WorkspaceSpreadsheetRoot } from "@/components/issues/issue-layouts/spreadsheet/roots/workspace-root";
import { WorkspaceAdditionalLayouts } from "@/plane-web/components/views/helper";

export type TWorkspaceLayoutProps = {
  activeLayout: EIssueLayoutTypes | undefined;
  isDefaultView: boolean;
  isLoading?: boolean;
  toggleLoading: (value: boolean) => void;
  workspaceSlug: string;
  globalViewId: string;
  routeFilters: {
    [key: string]: string;
  };
  fetchNextPages: () => void;
  globalViewsLoading: boolean;
  issuesLoading: boolean;
};

export function WorkspaceActiveLayout(props: TWorkspaceLayoutProps) {
  const {
    activeLayout = EIssueLayoutTypes.SPREADSHEET,
    isDefaultView,
    isLoading,
    toggleLoading,
    workspaceSlug,
    globalViewId,
    routeFilters,
    fetchNextPages,
    globalViewsLoading,
    issuesLoading,
  } = props;
  switch (activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <BaseListRoot QuickActions={AllIssueQuickActions} viewId={globalViewId} />;
    case EIssueLayoutTypes.KANBAN:
      return <BaseKanBanRoot QuickActions={AllIssueQuickActions} viewId={globalViewId} />;
    case EIssueLayoutTypes.CALENDAR:
      return <BaseCalendarRoot QuickActions={AllIssueQuickActions} viewId={globalViewId} />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot viewId={globalViewId} />;
    case EIssueLayoutTypes.SPREADSHEET:
      return (
        <WorkspaceSpreadsheetRoot
          isDefaultView={isDefaultView}
          isLoading={isLoading}
          toggleLoading={toggleLoading}
          workspaceSlug={workspaceSlug}
          globalViewId={globalViewId}
          routeFilters={routeFilters}
          fetchNextPages={fetchNextPages}
          globalViewsLoading={globalViewsLoading}
          issuesLoading={issuesLoading}
        />
      );
    default:
      return <WorkspaceAdditionalLayouts {...props} />;
  }
}
