/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Widget card for Custom Dashboard — renders chart via WidgetAdapter + context menu.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { GripVertical } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { IDashboardWidget } from "@plane/types";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";
import { WidgetAdapter } from "./widget-adapter";
import { WidgetContextMenu } from "./widget-context-menu";

interface CustomDashboardWidgetCardProps {
  widget: IDashboardWidget;
  workspaceSlug: string;
  isEditMode: boolean;
  onDelete: (widgetId: string) => void;
  onConfigure: (widgetId: string) => void;
}

export const CustomDashboardWidgetCard = observer(function CustomDashboardWidgetCard({
  widget,
  workspaceSlug,
  isEditMode,
  onDelete,
  onConfigure,
}: CustomDashboardWidgetCardProps) {
  const { t } = useTranslation();
  const dashboardStore = useCustomDashboard();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await dashboardStore.fetchWidgetChartData(workspaceSlug, widget.dashboard, widget.id);
      } catch (error) {
        console.error("Failed to fetch widget chart data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [workspaceSlug, widget.dashboard, widget.id, dashboardStore]);

  return (
    <div className="relative h-full rounded-lg border border-color-subtle bg-surface-1 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isEditMode && (
            <div className="drag-handle cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-color-placeholder" />
            </div>
          )}
          <h3 className="text-sm font-medium text-color-secondary">{widget.name}</h3>
        </div>
        <WidgetContextMenu
          widget={widget}
          workspaceSlug={workspaceSlug}
          onEdit={() => onConfigure(widget.id)}
          onDelete={() => onDelete(widget.id)}
        />
      </div>

      <div className="h-[calc(100%-3rem)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-color-tertiary text-xs">
            {t("analytics_dashboard.loading")}
          </div>
        ) : (
          <WidgetAdapter widget={widget} workspaceSlug={workspaceSlug} dashboardId={widget.dashboard} />
        )}
      </div>
    </div>
  );
});
