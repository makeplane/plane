/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { EIssueLayoutTypes, IProjectView } from "@plane/types";
import { EIssueLayoutTypes as LayoutTypes } from "@plane/types";
import type { TWorkspaceLayoutProps } from "@/components/views/helper";
import { LayoutSelection } from "@/components/issues/issue-layouts/filters/header/layout-selection";
import { WorkspaceCalendarRoot } from "@/components/issues/issue-layouts/calendar/roots/workspace-root";
import { WorkspaceKanBanRoot } from "@/components/issues/issue-layouts/kanban/roots/workspace-root";

export type TLayoutSelectionProps = {
  onChange: (layout: EIssueLayoutTypes) => void;
  selectedLayout: EIssueLayoutTypes;
};

// Supported layouts for workspace views: Spreadsheet, Calendar, Kanban
const WORKSPACE_VIEW_LAYOUTS: EIssueLayoutTypes[] = [
  LayoutTypes.SPREADSHEET,
  LayoutTypes.CALENDAR,
  LayoutTypes.KANBAN,
];

export function GlobalViewLayoutSelection(props: TLayoutSelectionProps) {
  const { onChange, selectedLayout } = props;

  return (
    <LayoutSelection
      layouts={WORKSPACE_VIEW_LAYOUTS}
      onChange={onChange}
      selectedLayout={selectedLayout}
    />
  );
}

export function WorkspaceAdditionalLayouts(props: TWorkspaceLayoutProps) {
  const {
    activeLayout,
    isDefaultView,
    globalViewId,
  } = props;

  switch (activeLayout) {
    case LayoutTypes.CALENDAR:
      return (
        <WorkspaceCalendarRoot
          isDefaultView={isDefaultView}
          globalViewId={globalViewId}
        />
      );
    case LayoutTypes.KANBAN:
      return (
        <WorkspaceKanBanRoot
          isDefaultView={isDefaultView}
          globalViewId={globalViewId}
        />
      );
    default:
      return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdditionalHeaderItems(view: IProjectView) {
  return <></>;
}
