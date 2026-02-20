/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { ArrowLeft, Edit2, RefreshCw, Plus } from "lucide-react";
import { DashboardIcon } from "@plane/propel/icons";
import { Button, Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { PageHead } from "@/components/core/page-title";
import { useAnalyticsDashboard } from "@/hooks/store/use-analytics-dashboard";
import { useAppRouter } from "@/hooks/use-app-router";
import { AnalyticsDashboardWidgetGrid } from "@/components/dashboards/analytics-dashboard-widget-grid";
import { WidgetConfigModal } from "@/components/dashboards/widget-config-modal";
import type { IAnalyticsDashboardWidget, TAnalyticsWidgetCreate, TAnalyticsWidgetUpdate } from "@plane/types";
import type { Route } from "./+types/page";

function DashboardDetailPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, dashboardId } = params;
  const router = useAppRouter();
  const analyticsDashboardStore = useAnalyticsDashboard();
  const [isEditMode, setIsEditMode] = useState(false);
  const [configWidget, setConfigWidget] = useState<IAnalyticsDashboardWidget | null>(null);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  useEffect(() => {
    if (workspaceSlug && dashboardId) {
      analyticsDashboardStore.setActiveDashboard(dashboardId);
      analyticsDashboardStore.fetchDashboard(workspaceSlug, dashboardId);
    }
    return () => {
      analyticsDashboardStore.setActiveDashboard(null);
    };
  }, [workspaceSlug, dashboardId, analyticsDashboardStore]);

  const { currentDashboard, sortedWidgets, loader } = analyticsDashboardStore;
  const pageTitle = currentDashboard?.name ?? "Dashboard";

  const handleRefresh = async () => {
    try {
      await analyticsDashboardStore.fetchDashboard(workspaceSlug, dashboardId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Dashboard refreshed",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to refresh dashboard",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      await analyticsDashboardStore.deleteWidget(workspaceSlug, dashboardId, widgetId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Widget deleted",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to delete widget",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleAddWidget = () => {
    setIsAddWidgetOpen(true);
  };

  const handleConfigureWidget = (widgetId: string) => {
    const widget = sortedWidgets.find((w) => w.id === widgetId) ?? null;
    setConfigWidget(widget);
  };

  const handleLayoutChange = async (
    positions: Array<{ id: string; position: { row: number; col: number; width: number; height: number } }>
  ) => {
    try {
      await analyticsDashboardStore.updateWidgetPositions(workspaceSlug, dashboardId, positions);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to update layout",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDuplicateWidget = async (widgetId: string) => {
    try {
      await analyticsDashboardStore.duplicateWidget(workspaceSlug, dashboardId, widgetId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Widget duplicated" });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to duplicate widget",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleWidgetSubmit = async (
    data: TAnalyticsWidgetCreate | TAnalyticsWidgetUpdate
  ) => {
    try {
      if (configWidget) {
        await analyticsDashboardStore.updateWidget(
          workspaceSlug,
          dashboardId,
          configWidget.id,
          data as TAnalyticsWidgetUpdate
        );
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Widget updated",
        });
      } else {
        await analyticsDashboardStore.createWidget(
          workspaceSlug,
          dashboardId,
          data as TAnalyticsWidgetCreate
        );
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Widget added",
        });
      }
      setIsAddWidgetOpen(false);
      setConfigWidget(null);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: configWidget ? "Failed to update widget" : "Failed to add widget",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-subtle bg-surface-1 px-4 py-3 relative z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-2"
              onClick={() => router.push(`/${workspaceSlug}/dashboards`)}
            >
              <ArrowLeft className="h-4 w-4 text-tertiary" />
            </button>
            <DashboardIcon className="h-5 w-5 text-accent-primary" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold">{pageTitle}</h1>
              {currentDashboard?.description && (
                <p className="truncate text-sm text-tertiary">{currentDashboard.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={handleAddWidget}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
            <Button
              variant="link-neutral"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant={isEditMode ? "primary" : "neutral-primary"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              {isEditMode ? "Done" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 relative z-0">
          {loader ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Loader key={i} className="rounded-lg border border-subtle p-4">
                  <Loader.Item height="16px" width="40%" />
                  <Loader.Item height="200px" width="100%" className="mt-3" />
                </Loader>
              ))}
            </div>
          ) : sortedWidgets.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <p className="text-sm text-tertiary">
                No widgets yet. Add your first widget to get started.
              </p>
              <Button onClick={handleAddWidget} className="gap-2">
                Add Widget
              </Button>
            </div>
          ) : (
            <AnalyticsDashboardWidgetGrid
              widgets={sortedWidgets}
              workspaceSlug={workspaceSlug}
              dashboardId={dashboardId}
              isEditMode={isEditMode}
              onAddWidget={handleAddWidget}
              onDeleteWidget={handleDeleteWidget}
              onConfigureWidget={handleConfigureWidget}
              onDuplicateWidget={handleDuplicateWidget}
              onLayoutChange={handleLayoutChange}
            />
          )}
        </div>
      </div>

      {/* Widget Config Modal */}
      <WidgetConfigModal
        isOpen={isAddWidgetOpen || !!configWidget}
        onClose={() => {
          setIsAddWidgetOpen(false);
          setConfigWidget(null);
        }}
        onSubmit={handleWidgetSubmit}
        widget={configWidget}
      />
    </>
  );
}

export default observer(DashboardDetailPage);
