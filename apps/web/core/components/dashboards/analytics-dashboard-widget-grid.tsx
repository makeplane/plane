/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ResponsiveGridLayout  } from "react-grid-layout";
import type {Layout} from "react-grid-layout";
import { Plus } from "lucide-react";
import type { IAnalyticsDashboardWidget } from "@plane/types";
import { EAnalyticsWidgetType } from "@plane/types";
import { AnalyticsDashboardWidgetCard } from "./analytics-dashboard-widget-card";
import "react-grid-layout/css/styles.css";

// Minimum size constraints per widget type
const MIN_SIZE: Record<string, { minW: number; minH: number }> = {
  [EAnalyticsWidgetType.NUMBER]: { minW: 2, minH: 2 },
  [EAnalyticsWidgetType.BAR]: { minW: 3, minH: 3 },
  [EAnalyticsWidgetType.LINE]: { minW: 3, minH: 3 },
  [EAnalyticsWidgetType.AREA]: { minW: 3, minH: 3 },
  [EAnalyticsWidgetType.DONUT]: { minW: 3, minH: 3 },
  [EAnalyticsWidgetType.PIE]: { minW: 3, minH: 3 },
};

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 };
const COLS = { lg: 12, md: 8, sm: 4 };

type WidgetPosition = { id: string; position: { row: number; col: number; width: number; height: number } };

type AnalyticsDashboardWidgetGridProps = {
  widgets: IAnalyticsDashboardWidget[];
  workspaceSlug: string;
  dashboardId: string;
  isEditMode: boolean;
  onAddWidget: () => void;
  onDeleteWidget: (widgetId: string) => void;
  onConfigureWidget: (widgetId: string) => void;
  onDuplicateWidget?: (widgetId: string) => void;
  onLayoutChange?: (positions: WidgetPosition[]) => void;
};

export const AnalyticsDashboardWidgetGrid = observer(function AnalyticsDashboardWidgetGrid({
  widgets,
  workspaceSlug,
  dashboardId,
  isEditMode,
  onAddWidget,
  onDeleteWidget,
  onConfigureWidget,
  onDuplicateWidget,
  onLayoutChange,
}: AnalyticsDashboardWidgetGridProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Build layout items from widget positions
  const layout = useMemo(
    () =>
      widgets.map((widget) => {
        const constraints = MIN_SIZE[widget.widget_type] ?? { minW: 2, minH: 2 };
        return {
          i: widget.id,
          x: widget.position.col,
          y: widget.position.row,
          w: widget.position.width,
          h: widget.position.height,
          ...constraints,
          static: !isEditMode,
        };
      }),
    [widgets, isEditMode]
  );

  // Debounced layout change handler
  const handleLayoutChange = useCallback(
    (currentLayout: Layout) => {
      if (!isEditMode || !onLayoutChange) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const positions: WidgetPosition[] = currentLayout
          .filter((item) => item.i !== "__add_widget__")
          .map((item) => ({
            id: item.i,
            position: { row: item.y, col: item.x, width: item.w, height: item.h },
          }));
        onLayoutChange(positions);
      }, 500);
    },
    [isEditMode, onLayoutChange]
  );

  // Add widget placeholder to layout in edit mode
  const fullLayout = useMemo(() => {
    if (!isEditMode) return layout;
    return [...layout, { i: "__add_widget__", x: 0, y: Infinity, w: 4, h: 4, static: true }];
  }, [layout, isEditMode]);

  return (
    <div ref={containerRef}>
      {containerWidth > 0 && (
        <ResponsiveGridLayout
          className="analytics-widget-grid"
          layouts={{ lg: fullLayout }}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          width={containerWidth}
          rowHeight={60}
          onLayoutChange={(layout) => handleLayoutChange(layout)}
          margin={[16, 16] as [number, number]}
          containerPadding={[0, 0] as [number, number]}
          compactType="vertical"
          dragConfig={{ enabled: isEditMode, bounded: false, handle: ".widget-drag-handle" }}
          resizeConfig={{ enabled: isEditMode }}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <AnalyticsDashboardWidgetCard
                widget={widget}
                workspaceSlug={workspaceSlug}
                dashboardId={dashboardId}
                isEditMode={isEditMode}
                onDelete={onDeleteWidget}
                onConfigure={onConfigureWidget}
                onDuplicate={onDuplicateWidget}
              />
            </div>
          ))}

          {/* Add widget button in edit mode */}
          {isEditMode && (
            <div key="__add_widget__">
              <button
                onClick={onAddWidget}
                className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-custom-border-200 bg-custom-background-80 transition-colors hover:border-custom-border-300 hover:bg-custom-background-90"
              >
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-8 w-8 text-custom-text-300" />
                  <span className="text-sm font-medium text-custom-text-300">Add Widget</span>
                </div>
              </button>
            </div>
          )}
        </ResponsiveGridLayout>
      )}
    </div>
  );
});
