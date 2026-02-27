/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { PageHead } from "@/components/core/page-title";
import { useAppRouter } from "@/hooks/use-app-router";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";
import { WidgetAdapter } from "@/plane-web/components/dashboards/widget-adapter";
import { WidgetContextMenu } from "@/plane-web/components/dashboards/widget-context-menu";
import { WidgetConfigModal } from "@/plane-web/components/dashboards/widget-config-modal";
import type { Route } from "./+types/page";

const DashboardDetailPage = observer(function DashboardDetailPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, dashboardId } = params;
  const router = useAppRouter();
  const store = useCustomDashboard();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceSlug || !dashboardId) return;
    void store.fetchDashboards(workspaceSlug);
    void store.fetchWidgets(workspaceSlug, dashboardId);
  }, [workspaceSlug, dashboardId, store]);

  const widgets = useMemo(() => store.dashboardWidgets[dashboardId] ?? [], [store.dashboardWidgets, dashboardId]);

  // Fetch chart data for each widget once widgets are loaded
  useEffect(() => {
    if (!workspaceSlug || !dashboardId || widgets.length === 0) return;
    widgets.forEach((w) => {
      if (!store.widgetChartData[w.id]) {
        void store.fetchWidgetChartData(workspaceSlug, dashboardId, w.id);
      }
    });
  }, [workspaceSlug, dashboardId, widgets, store]);

  const dashboard = useMemo(() => store.dashboards.find((d) => d.id === dashboardId), [store.dashboards, dashboardId]);
  const pageTitle = dashboard?.name ?? "Dashboard";

  const handleDeleteWidget = useCallback(
    async (widgetId: string) => {
      try {
        await store.deleteWidget(workspaceSlug, dashboardId, widgetId);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Widget deleted" });
      } catch {
        setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete widget" });
      }
    },
    [store, workspaceSlug, dashboardId]
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-color-subtle px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/${workspaceSlug}/dashboards`)}
              className="text-color-secondary hover:text-color-primary text-sm"
            >
              Dashboards
            </button>
            <span className="text-color-tertiary">/</span>
            <h1 className="text-base font-medium text-color-primary">{pageTitle}</h1>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsConfigOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Widget
          </Button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          {store.isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Loader key={i} className="rounded-lg border border-color-subtle p-4">
                  <Loader.Item height="16px" width="40%" />
                  <Loader.Item height="200px" width="100%" className="mt-3" />
                </Loader>
              ))}
            </div>
          ) : widgets.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <p className="text-sm text-color-tertiary">No widgets yet. Add your first widget to get started.</p>
              <Button onClick={() => setIsConfigOpen(true)}>Add Widget</Button>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4 auto-rows-[200px]">
              {widgets.map((w) => (
                <div
                  key={w.id}
                  className="rounded-lg border border-color-subtle bg-surface-1 overflow-hidden"
                  style={{ gridColumn: `span ${w.width ?? 6}`, gridRow: `span ${w.height ?? 2}` }}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-color-subtle">
                    <span className="text-sm font-medium text-color-primary truncate">{w.name ?? "Widget"}</span>
                    <WidgetContextMenu
                      widget={w}
                      workspaceSlug={workspaceSlug}
                      onEdit={() => setEditingWidgetId(w.id)}
                      onDelete={() => void handleDeleteWidget(w.id)}
                    />
                  </div>
                  <WidgetAdapter widget={w} workspaceSlug={workspaceSlug} dashboardId={dashboardId} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WidgetConfigModal
        isOpen={isConfigOpen || !!editingWidgetId}
        onClose={() => {
          setIsConfigOpen(false);
          setEditingWidgetId(null);
        }}
        onSubmit={async (data) => {
          try {
            if (editingWidgetId) {
              await store.updateWidget(workspaceSlug, dashboardId, editingWidgetId, data);
            } else {
              await store.createWidget(workspaceSlug, dashboardId, data);
            }
            setIsConfigOpen(false);
            setEditingWidgetId(null);
          } catch {
            setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save widget" });
          }
        }}
        widget={editingWidgetId ? widgets.find((w) => w.id === editingWidgetId) : null}
      />
    </>
  );
});

export default DashboardDetailPage;
