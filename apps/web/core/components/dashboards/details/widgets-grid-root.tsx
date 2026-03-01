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

import { useCallback, useState } from "react";
import { pick, isEqual } from "lodash-es";
import { observer } from "mobx-react";
import type { Layouts, Layout } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";
// plane imports
import { EWidgetGridBreakpoints, WIDGET_GRID_BREAKPOINTS } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// local imports
import { DashboardWidgetRoot } from "../widgets";
// react-grid-layout styles
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type Props = {
  dashboardId: string;
};

const ResponsiveGridLayout = WidthProvider(Responsive);

export const DashboardsWidgetsGridRoot = observer(function DashboardsWidgetsGridRoot(props: Props) {
  const { dashboardId } = props;
  // states
  const [activeBreakpoint, setActiveBreakpoint] = useState<EWidgetGridBreakpoints>(EWidgetGridBreakpoints.MD);
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { canCurrentUserEditDashboard, isViewModeEnabled, widgetsStore } = dashboardDetails ?? {};
  const { allWidgetIds, layoutItems, updateWidgetsLayout } = widgetsStore ?? {};

  const handleLayoutChange = useCallback(
    async (_: Layout[], allLayouts: Layouts) => {
      const currentLayout = allLayouts[EWidgetGridBreakpoints.MD];
      try {
        // find which items changed by comparing with previous layout
        const layoutChanges = currentLayout.filter((item) => {
          const prevItem = layoutItems?.[EWidgetGridBreakpoints.MD].find((prev) => prev.i === item.i);
          if (!prevItem) return true;
          // check if position or size changed
          return !isEqual(pick(item, ["x", "y", "w", "h"]), pick(prevItem, ["x", "y", "w", "h"]));
        });
        await updateWidgetsLayout?.(layoutChanges);
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Could not re-arrange widget. Please try again.",
        });
      }
    },
    [layoutItems, updateWidgetsLayout]
  );

  const handleBreakpointChange = useCallback((newBreakpoint: EWidgetGridBreakpoints) => {
    setActiveBreakpoint(newBreakpoint);
  }, []);

  return (
    <ResponsiveGridLayout
      breakpoints={WIDGET_GRID_BREAKPOINTS}
      layouts={layoutItems}
      cols={{
        [EWidgetGridBreakpoints.XXS]: 1,
        [EWidgetGridBreakpoints.MD]: 4,
      }}
      rowHeight={100}
      margin={[32, 32]}
      containerPadding={[0, 0]}
      draggableHandle=".widget-drag-handle"
      isDraggable={!isViewModeEnabled && canCurrentUserEditDashboard && activeBreakpoint === EWidgetGridBreakpoints.MD}
      isResizable={!isViewModeEnabled && canCurrentUserEditDashboard && activeBreakpoint === EWidgetGridBreakpoints.MD}
      onBreakpointChange={handleBreakpointChange}
      onLayoutChange={handleLayoutChange}
    >
      {allWidgetIds?.map((widgetId) => {
        if (!widgetId) return null;

        return (
          <div key={widgetId} id={`widget-${widgetId}`}>
            <DashboardWidgetRoot activeBreakpoint={activeBreakpoint} dashboardId={dashboardId} widgetId={widgetId} />
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
});
