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
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import { PageHead } from "@/components/core/page-title";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";
import type { Route } from "./+types/page";
import type { IDashboard } from "@plane/types";
import { DashboardCard } from "./components/dashboard-card";
import { DashboardDeleteModal } from "./components/dashboard-delete-modal";
import { DashboardFormModal } from "@/plane-web/components/dashboards/dashboard-form-modal";
import type { DashboardFormPayload } from "@/plane-web/components/dashboards/dashboard-form-modal";
import { DashboardListHeader } from "./components/dashboard-list-header";

const DashboardListPage = observer(function DashboardListPage({ params }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug } = params;
  const store = useCustomDashboard();

  // modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDashboard, setEditDashboard] = useState<IDashboard | null>(null);
  const [deleteDashboard, setDeleteDashboard] = useState<IDashboard | null>(null);

  // fetch dashboards on mount
  useEffect(() => {
    if (workspaceSlug) void store.fetchDashboards(workspaceSlug);
  }, [workspaceSlug, store]);

  const handleCreate = useCallback(
    async (data: DashboardFormPayload) => {
      if (!workspaceSlug) return;
      try {
        await store.createDashboard(workspaceSlug, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("analytics_dashboard.success"),
          message: t("analytics_dashboard.created_success"),
        });
      } catch (error) {
        setToast({ type: TOAST_TYPE.ERROR, title: t("analytics_dashboard.create_failed") });
        throw error;
      }
    },
    [workspaceSlug, store, t]
  );

  const handleUpdate = useCallback(
    async (data: DashboardFormPayload) => {
      if (!workspaceSlug || !editDashboard) return;
      try {
        await store.updateDashboard(workspaceSlug, editDashboard.id, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("analytics_dashboard.success"),
          message: t("analytics_dashboard.updated_success"),
        });
        setEditDashboard(null);
      } catch (error) {
        setToast({ type: TOAST_TYPE.ERROR, title: t("analytics_dashboard.update_failed") });
        throw error;
      }
    },
    [workspaceSlug, editDashboard, store, t]
  );

  const handleDelete = useCallback(async () => {
    if (!workspaceSlug || !deleteDashboard) return;
    try {
      await store.deleteDashboard(workspaceSlug, deleteDashboard.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("analytics_dashboard.success"),
        message: t("analytics_dashboard.deleted_success"),
      });
      setDeleteDashboard(null);
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("analytics_dashboard.delete_failed") });
      throw error;
    }
  }, [workspaceSlug, deleteDashboard, store, t]);

  const pageTitle = t("dashboards");
  const { dashboards, isLoading } = store;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col">
        <DashboardListHeader onCreateClick={() => setIsCreateOpen(true)} />

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Loader key={i} className="rounded-lg border border-color-subtle p-4">
                  <Loader.Item height="20px" width="60%" />
                  <Loader.Item height="14px" width="80%" className="mt-3" />
                  <Loader.Item height="12px" width="40%" className="mt-4" />
                </Loader>
              ))}
            </div>
          ) : dashboards.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <LayoutDashboard className="h-12 w-12 text-color-tertiary" />
              <p className="text-center text-sm text-color-secondary">
                {t("analytics_dashboard.empty_title")}
                <br />
                {t("analytics_dashboard.create_first")}
              </p>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                {t("analytics_dashboard.create_dashboard")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboards.map((dashboard) => (
                <DashboardCard
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

      {/* Modals */}
      <DashboardFormModal
        isOpen={isCreateOpen && !editDashboard}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      {editDashboard && (
        <DashboardFormModal
          isOpen={!!editDashboard}
          onClose={() => setEditDashboard(null)}
          onSubmit={handleUpdate}
          dashboard={editDashboard}
        />
      )}

      {deleteDashboard && (
        <DashboardDeleteModal
          isOpen={!!deleteDashboard}
          onClose={() => setDeleteDashboard(null)}
          onConfirm={handleDelete}
          dashboardName={deleteDashboard.name}
          workspaceSlug={workspaceSlug}
        />
      )}
    </>
  );
});

export default DashboardListPage;
