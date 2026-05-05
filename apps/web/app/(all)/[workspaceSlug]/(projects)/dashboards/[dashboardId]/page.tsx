/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
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
  const { t } = useTranslation();
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

  const widgets = store.dashboardWidgets[dashboardId] ?? [];

  // Fetch chart data for each widget once widgets are loaded
  const widgetIds = widgets.map((w) => w.id).join(",");
  useEffect(() => {
    if (!workspaceSlug || !dashboardId || !widgetIds) return;
    widgetIds.split(",").forEach((id) => {
      if (!store.widgetChartData[id]) {
        void store.fetchWidgetChartData(workspaceSlug, dashboardId, id);
      }
    });
  }, [workspaceSlug, dashboardId, widgetIds, store]);

  const dashboard = store.dashboards.find((d) => d.id === dashboardId);
  const pageTitle = dashboard?.name ?? "Dashboard";

  const handleDeleteWidget = useCallback(
    async (widgetId: string) => {
      try {
        await store.deleteWidget(workspaceSlug, dashboardId, widgetId);
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("analytics_dashboard.widget_deleted") });
      } catch {
        setToast({ type: TOAST_TYPE.ERROR, title: t("analytics_dashboard.delete_widget_failed") });
      }
    },
    [store, workspaceSlug, dashboardId, t]
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/${workspaceSlug}/dashboards`)}
              className="text-secondary hover:text-primary text-sm"
            >
              {t("analytics_dashboard.breadcrumb_dashboards")}
            </button>
            <span className="text-tertiary">/</span>
            <h1 className="text-base font-medium text-primary">{pageTitle}</h1>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsConfigOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("analytics_dashboard.add_widget")}
          </Button>
        </div>

        {/* Grid */}
        <div className="flex-1 p-4">
          {store.isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Loader key={i} className="rounded-lg border border-subtle p-4">
                  <Loader.Item height="16px" width="40%" />
                  <Loader.Item height="200px" width="100%" className="mt-3" />
                </Loader>
              ))}
            </div>
          ) : widgets.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <p className="text-sm text-tertiary">{t("analytics_dashboard.empty_widgets")}</p>
              <Button onClick={() => setIsConfigOpen(true)}>{t("analytics_dashboard.add_widget")}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4 auto-rows-[200px]">
              {widgets.map((w) => (
                <div
                  key={w.id}
                  className="rounded-lg border border-subtle bg-surface-1 overflow-hidden"
                  style={{ gridColumn: `span ${w.width ?? 6}`, gridRow: `span ${w.height ?? 2}` }}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-subtle">
                    <span className="text-sm font-medium text-primary truncate">{w.name ?? "Widget"}</span>
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
            setToast({ type: TOAST_TYPE.ERROR, title: t("analytics_dashboard.update_widget_failed") });
          }
        }}
        widget={editingWidgetId ? widgets.find((w) => w.id === editingWidgetId) : null}
      />
    </>
  );
});

export default DashboardDetailPage;
