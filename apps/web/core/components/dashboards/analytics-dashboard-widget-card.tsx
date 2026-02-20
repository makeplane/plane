/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Copy, GripVertical, MoreVertical, Settings, Trash2 } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IAnalyticsDashboardWidget } from "@plane/types";
import { useAnalyticsDashboard } from "@/hooks/store/use-analytics-dashboard";
import { WidgetChartRenderer } from "./widget-chart-renderer";

type AnalyticsDashboardWidgetCardProps = {
  widget: IAnalyticsDashboardWidget;
  workspaceSlug: string;
  dashboardId: string;
  isEditMode: boolean;
  onDelete: (widgetId: string) => void;
  onConfigure: (widgetId: string) => void;
  onDuplicate?: (widgetId: string) => void;
};

export const AnalyticsDashboardWidgetCard = observer(function AnalyticsDashboardWidgetCard({
  widget,
  workspaceSlug,
  dashboardId,
  isEditMode,
  onDelete,
  onConfigure,
  onDuplicate,
}: AnalyticsDashboardWidgetCardProps) {
  const analyticsDashboardStore = useAnalyticsDashboard();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  useOutsideClickDetector(menuRef, () => setShowMenu(false));
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        await analyticsDashboardStore.fetchWidgetData(workspaceSlug, dashboardId, widget.id);
      } catch (error) {
        console.error("Failed to fetch widget data:", error);
        setHasError(true);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Failed to load widget data",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [workspaceSlug, dashboardId, widget.id, analyticsDashboardStore]);

  const widgetData = analyticsDashboardStore.widgetDataMap.get(widget.id);

  return (
    <div className="relative h-full rounded-lg border border-subtle bg-surface-1 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isEditMode && (
            <div className="widget-drag-handle cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-placeholder" />
            </div>
          )}
          <h3 className="text-sm font-medium text-secondary">{widget.title}</h3>
        </div>
        {isEditMode && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-2"
            >
              <MoreVertical className="h-4 w-4 text-tertiary" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 min-w-[160px] rounded-md border border-subtle bg-surface-1 shadow-lg">
                <button
                  onClick={() => {
                    onConfigure(widget.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-layer-2"
                >
                  <Settings className="h-4 w-4" /> Configure
                </button>
                {onDuplicate && (
                  <button
                    onClick={() => {
                      onDuplicate(widget.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-layer-2"
                  >
                    <Copy className="h-4 w-4" /> Duplicate
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(widget.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-layer-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="h-[calc(100%-3rem)]">
        <WidgetChartRenderer widget={widget} widgetData={widgetData} isLoading={isLoading} hasError={hasError} />
      </div>
    </div>
  );
});
