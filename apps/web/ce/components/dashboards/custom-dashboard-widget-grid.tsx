/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Drag-and-drop responsive grid for Custom Dashboard widgets using react-grid-layout.
 * Columns: 12, rowHeight: 50px, margin: [16, 16]
 */

import { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import ReactGridLayout from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import type { IDashboardWidget } from "@plane/types";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";
import { CustomDashboardWidgetCard } from "./custom-dashboard-widget-card";
import "react-grid-layout/css/styles.css";

const ResponsiveGridLayout = ReactGridLayout.WidthProvider(ReactGridLayout.Responsive);

/** Convert IDashboardWidget to react-grid-layout Layout item */
function widgetToLayoutItem(widget: IDashboardWidget): Layout {
  return {
    i: widget.id,
    x: widget.x_axis_coord ?? 0,
    y: widget.y_axis_coord ?? 0,
    w: widget.width ?? 6,
    h: widget.height ?? 4,
    minW: 3,
    minH: 2,
  };
}

interface CustomDashboardWidgetGridProps {
  widgets: IDashboardWidget[];
  workspaceSlug: string;
  dashboardId: string;
  isEditMode: boolean;
  onDeleteWidget: (widgetId: string) => void;
  onConfigureWidget: (widgetId: string) => void;
}

export const CustomDashboardWidgetGrid = observer(function CustomDashboardWidgetGrid({
  widgets,
  workspaceSlug,
  dashboardId,
  isEditMode,
  onDeleteWidget,
  onConfigureWidget,
}: CustomDashboardWidgetGridProps) {
  const dashboardStore = useCustomDashboard();
  // Debounce timer ref — avoid hammering the API on every drag/resize move
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[], _allLayouts: Record<string, Layout[]>) => {
      if (!isEditMode) return;

      // Build position payload from layout

      const positions = currentLayout.map((item) => ({
        id: item.i,
        x_axis_coord: item.x,
        y_axis_coord: item.y,
        width: item.w,
        height: item.h,
      }));

      // Debounce 500ms to reduce API calls during continuous drag/resize
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void dashboardStore.bulkUpdatePositions(workspaceSlug, dashboardId, positions);
      }, 500);
    },
    [isEditMode, workspaceSlug, dashboardId, dashboardStore]
  );

  const layout = widgets.map(widgetToLayoutItem);

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout, md: layout, sm: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={50}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      isDraggable={isEditMode}
      isResizable={isEditMode}
      preventCollision={false}
      compactType="vertical"
      draggableHandle=".drag-handle"
      onLayoutChange={handleLayoutChange}
    >
      {widgets.map((widget) => (
        <div key={widget.id}>
          <CustomDashboardWidgetCard
            widget={widget}
            workspaceSlug={workspaceSlug}
            isEditMode={isEditMode}
            onDelete={onDeleteWidget}
            onConfigure={onConfigureWidget}
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
});
