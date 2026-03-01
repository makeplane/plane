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

import { lazy, Suspense } from "react";
import type { LazyExoticComponent, ComponentType } from "react";
// plane imports
import { EIssueLayoutTypes } from "@plane/types";

// Lazy load layout loaders
const ListLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/list-layout-loader").then((module) => ({
    default: module.ListLayoutLoader,
  }))
);
const KanbanLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/kanban-layout-loader").then((module) => ({
    default: module.KanbanLayoutLoader,
  }))
);
const SpreadsheetLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/spreadsheet-layout-loader").then((module) => ({
    default: module.SpreadsheetLayoutLoader,
  }))
);
const CalendarLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/calendar-layout-loader").then((module) => ({
    default: module.CalendarLayoutLoader,
  }))
);
const TimelineLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/timeline-layout-loader").then((module) => ({
    default: module.TimelineLayoutLoader,
  }))
);

// Layout components map
const WORK_ITEM_LAYOUT_LOADERS: Partial<Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType>>> = {
  [EIssueLayoutTypes.LIST]: ListLayoutLoader,
  [EIssueLayoutTypes.KANBAN]: KanbanLayoutLoader,
  [EIssueLayoutTypes.SPREADSHEET]: SpreadsheetLayoutLoader,
  [EIssueLayoutTypes.CALENDAR]: CalendarLayoutLoader,
  [EIssueLayoutTypes.GANTT]: TimelineLayoutLoader,
};

export function WorkItemLayoutActiveLoader(props: { layout: EIssueLayoutTypes }) {
  const { layout } = props;
  const WorkItemLayoutLoaderComponent = WORK_ITEM_LAYOUT_LOADERS[layout];
  if (!WorkItemLayoutLoaderComponent) return <></>;
  return (
    <Suspense>
      <WorkItemLayoutLoaderComponent />
    </Suspense>
  );
}
