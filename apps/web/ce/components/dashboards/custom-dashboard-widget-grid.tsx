/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Simple responsive grid for Custom Dashboard widgets using IDashboardWidget type.
 */

import { observer } from "mobx-react";
import type { IDashboardWidget } from "@plane/types";
import { CustomDashboardWidgetCard } from "./custom-dashboard-widget-card";

interface CustomDashboardWidgetGridProps {
  widgets: IDashboardWidget[];
  workspaceSlug: string;
  isEditMode: boolean;
  onDeleteWidget: (widgetId: string) => void;
  onConfigureWidget: (widgetId: string) => void;
}

export const CustomDashboardWidgetGrid = observer(function CustomDashboardWidgetGrid({
  widgets,
  workspaceSlug,
  isEditMode,
  onDeleteWidget,
  onConfigureWidget,
}: CustomDashboardWidgetGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {widgets.map((widget) => (
        <div key={widget.id} className="min-h-[280px]">
          <CustomDashboardWidgetCard
            widget={widget}
            workspaceSlug={workspaceSlug}
            isEditMode={isEditMode}
            onDelete={onDeleteWidget}
            onConfigure={onConfigureWidget}
          />
        </div>
      ))}
    </div>
  );
});
