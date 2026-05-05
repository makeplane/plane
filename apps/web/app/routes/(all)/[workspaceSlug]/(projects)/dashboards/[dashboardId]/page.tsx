/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { PageHead } from "@/components/core/page-title";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";
import { useAppRouter } from "@/hooks/use-app-router";
import { CustomDashboardWidgetGrid } from "@/plane-web/components/dashboards/custom-dashboard-widget-grid";
import { WidgetConfigModal } from "@/plane-web/components/dashboards/widget-config-modal";
import type { WidgetFormData } from "@/plane-web/components/dashboards/widget-config-modal";
import type { IDashboardWidget, TDashboardWidgetCreate, TDashboardWidgetUpdate } from "@plane/types";
import { DashboardToolbar } from "./dashboard-toolbar";

const DashboardDetailPage = observer(function DashboardDetailPage() {
  const { t } = useTranslation();
  const { workspaceSlug = "", dashboardId = "" } = useParams<{ workspaceSlug: string; dashboardId: string }>();
  const router = useAppRouter();
  const dashboardStore = useCustomDashboard();
  const [isEditMode, setIsEditMode] = useState(false);
  const [configWidget, setConfigWidget] = useState<IDashboardWidget | null>(null);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (workspaceSlug && dashboardId) {
      setIsLoading(true);
      void dashboardStore.fetchWidgets(workspaceSlug, dashboardId).finally(() => setIsLoading(false));
    }
  }, [workspaceSlug, dashboardId, dashboardStore]);

  const currentDashboard = dashboardStore.dashboards.find((d) => d.id === dashboardId);
  const widgets = dashboardStore.dashboardWidgets[dashboardId] ?? [];
  const pageTitle = currentDashboard?.name ?? "Dashboard";

  const handleRefresh = async () => {
    try {
      await dashboardStore.fetchWidgets(workspaceSlug, dashboardId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("analytics_dashboard.dashboard_refreshed") });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("analytics_dashboard.refresh_failed"),
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      await dashboardStore.deleteWidget(workspaceSlug, dashboardId, widgetId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("analytics_dashboard.widget_deleted") });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("analytics_dashboard.delete_widget_failed"),
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleAddWidget = () => {
    setIsAddWidgetOpen(true);
  };

  const handleConfigureWidget = (widgetId: string) => {
    setConfigWidget(widgets.find((w) => w.id === widgetId) ?? null);
  };

  const handleWidgetSubmit = async (data: WidgetFormData) => {
    try {
      if (configWidget) {
        await dashboardStore.updateWidget(
          workspaceSlug,
          dashboardId,
          configWidget.id,
          data as unknown as TDashboardWidgetUpdate
        );
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("analytics_dashboard.widget_updated") });
      } else {
        await dashboardStore.createWidget(workspaceSlug, dashboardId, data as unknown as TDashboardWidgetCreate);
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("analytics_dashboard.widget_added") });
      }
      setIsAddWidgetOpen(false);
      setConfigWidget(null);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: configWidget
          ? t("analytics_dashboard.update_widget_failed")
          : t("analytics_dashboard.add_widget_failed"),
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col overflow-hidden relative">
        <DashboardToolbar
          pageTitle={pageTitle}
          description={currentDashboard?.description}
          isEditMode={isEditMode}
          onBack={() => router.push(`/${workspaceSlug}/dashboards`)}
          onAddWidget={handleAddWidget}
          onRefresh={() => void handleRefresh()}
          onToggleEdit={() => setIsEditMode(!isEditMode)}
        />

        <div className="flex-1 overflow-auto p-4 relative z-0">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <Button onClick={handleAddWidget} className="gap-2">
                {t("analytics_dashboard.add_widget")}
              </Button>
            </div>
          ) : (
            <CustomDashboardWidgetGrid
              widgets={widgets}
              workspaceSlug={workspaceSlug}
              dashboardId={dashboardId}
              isEditMode={isEditMode}
              onDeleteWidget={(id) => void handleDeleteWidget(id)}
              onConfigureWidget={handleConfigureWidget}
            />
          )}
        </div>
      </div>

      <WidgetConfigModal
        isOpen={isAddWidgetOpen || !!configWidget}
        onClose={() => {
          setIsAddWidgetOpen(false);
          setConfigWidget(null);
        }}
        onSubmit={handleWidgetSubmit}
        widget={
          configWidget
            ? {
                name: configWidget.name,
                chart_type: configWidget.chart_type,
                chart_model: configWidget.chart_model,
                x_axis_property: configWidget.x_axis_property,
                y_axis_metric: configWidget.y_axis_metric,
                group_by: configWidget.group_by,
                config: configWidget.config,
                filters: configWidget.filters,
                width: configWidget.width,
                height: configWidget.height,
              }
            : null
        }
      />
    </>
  );
});

export default DashboardDetailPage;
