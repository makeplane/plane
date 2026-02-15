/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { LayoutDashboard } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IAnalyticsDashboard, TAnalyticsDashboardCreate, TAnalyticsDashboardUpdate } from "@plane/types";
import { Button, Loader } from "@plane/ui";
import { PageHead } from "@/components/core/page-title";
import { useAnalyticsDashboard } from "@/hooks/store/use-analytics-dashboard";
import type { Route } from "./+types/page";
import { AnalyticsDashboardCard } from "./components/analytics-dashboard-card";
import { AnalyticsDashboardDeleteModal } from "./components/analytics-dashboard-delete-modal";
import { AnalyticsDashboardFormModal } from "./components/analytics-dashboard-form-modal";
import { AnalyticsDashboardListHeader } from "./components/analytics-dashboard-list-header";

function DashboardListPage({ params }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug } = params;
  const analyticsDashboardStore = useAnalyticsDashboard();

  // modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDashboard, setEditDashboard] = useState<IAnalyticsDashboard | null>(null);
  const [deleteDashboard, setDeleteDashboard] = useState<IAnalyticsDashboard | null>(null);

  // fetch dashboards on mount
  useEffect(() => {
    if (workspaceSlug) analyticsDashboardStore.fetchDashboards(workspaceSlug);
  }, [workspaceSlug, analyticsDashboardStore]);

  const handleCreate = useCallback(
    async (data: TAnalyticsDashboardCreate) => {
      if (!workspaceSlug) return;
      try {
        await analyticsDashboardStore.createDashboard(workspaceSlug, data);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!", message: "Dashboard created successfully." });
      } catch (error) {
        setToast({ type: TOAST_TYPE.ERROR, title: "Failed to create dashboard" });
        throw error;
      }
    },
    [workspaceSlug, analyticsDashboardStore]
  );

  const handleUpdate = useCallback(
    async (data: TAnalyticsDashboardUpdate) => {
      if (!workspaceSlug || !editDashboard) return;
      try {
        await analyticsDashboardStore.updateDashboard(workspaceSlug, editDashboard.id, data);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!", message: "Dashboard updated successfully." });
      } catch (error) {
        setToast({ type: TOAST_TYPE.ERROR, title: "Failed to update dashboard" });
        throw error;
      }
    },
    [workspaceSlug, editDashboard, analyticsDashboardStore]
  );

  const handleDelete = useCallback(async () => {
    if (!workspaceSlug || !deleteDashboard) return;
    try {
      await analyticsDashboardStore.deleteDashboard(workspaceSlug, deleteDashboard.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!", message: "Dashboard deleted successfully." });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete dashboard" });
      throw error;
    }
  }, [workspaceSlug, deleteDashboard, analyticsDashboardStore]);

  const pageTitle = t("dashboards");
  const { dashboardsList, loader } = analyticsDashboardStore;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col overflow-hidden">
        <AnalyticsDashboardListHeader onCreateClick={() => setIsCreateOpen(true)} />

        <div className="flex-1 overflow-auto">
          {loader ? (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Loader key={i} className="rounded-lg border border-custom-border-200 p-4">
                  <Loader.Item height="20px" width="60%" />
                  <Loader.Item height="14px" width="80%" className="mt-3" />
                  <Loader.Item height="12px" width="40%" className="mt-4" />
                </Loader>
              ))}
            </div>
          ) : dashboardsList.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-custom-primary-100/10">
                <LayoutDashboard className="h-8 w-8 text-custom-primary-100" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-custom-text-100">No dashboards yet</h3>
                <p className="mt-1 text-sm text-custom-text-300">
                  Create your first analytics dashboard to visualize work item data.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
              >
                Create dashboard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboardsList.map((dashboard) => (
                <AnalyticsDashboardCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  workspaceSlug={workspaceSlug}
                  onEdit={setEditDashboard}
                  onDelete={setDeleteDashboard}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <AnalyticsDashboardFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit modal */}
      <AnalyticsDashboardFormModal
        isOpen={!!editDashboard}
        onClose={() => setEditDashboard(null)}
        onSubmit={handleUpdate}
        dashboard={editDashboard}
      />

      {/* Delete modal */}
      <AnalyticsDashboardDeleteModal
        isOpen={!!deleteDashboard}
        onClose={() => setDeleteDashboard(null)}
        onConfirm={handleDelete}
        dashboard={deleteDashboard}
      />
    </>
  );
}

export default observer(DashboardListPage);
