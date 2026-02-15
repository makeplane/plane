/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import type { IAnalyticsDashboardWidget } from "@plane/types";
import { AnalyticsDashboardWidgetCard } from "./analytics-dashboard-widget-card";

type AnalyticsDashboardWidgetGridProps = {
  widgets: IAnalyticsDashboardWidget[];
  workspaceSlug: string;
  dashboardId: string;
  isEditMode: boolean;
  onAddWidget: () => void;
  onDeleteWidget: (widgetId: string) => void;
  onConfigureWidget: (widgetId: string) => void;
};

export const AnalyticsDashboardWidgetGrid = observer(function AnalyticsDashboardWidgetGrid({
  widgets,
  workspaceSlug,
  dashboardId,
  isEditMode,
  onAddWidget,
  onDeleteWidget,
  onConfigureWidget,
}: AnalyticsDashboardWidgetGridProps) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gridAutoRows: "60px",
      }}
    >
      {widgets.map((widget) => (
        <AnalyticsDashboardWidgetCard
          key={widget.id}
          widget={widget}
          workspaceSlug={workspaceSlug}
          dashboardId={dashboardId}
          isEditMode={isEditMode}
          onDelete={onDeleteWidget}
          onConfigure={onConfigureWidget}
        />
      ))}

      {/* Add widget button in edit mode */}
      {isEditMode && (
        <button
          onClick={onAddWidget}
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-custom-border-200 bg-custom-background-80 p-4 transition-colors hover:border-custom-border-300 hover:bg-custom-background-90"
          style={{
            gridColumn: "span 4",
            gridRow: "span 4",
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8 text-custom-text-300" />
            <span className="text-sm font-medium text-custom-text-300">Add Widget</span>
          </div>
        </button>
      )}
    </div>
  );
});

