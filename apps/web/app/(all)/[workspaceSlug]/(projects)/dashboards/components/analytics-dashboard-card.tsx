/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { DashboardIcon } from "@plane/propel/icons";
import type { IAnalyticsDashboard } from "@plane/types";
import { FavoriteStar } from "@plane/ui";
import { useAnalyticsDashboard } from "@/plane-web/hooks/store/use-analytics-dashboard";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  dashboard: IAnalyticsDashboard;
  workspaceSlug: string;
  onEdit: (dashboard: IAnalyticsDashboard) => void;
  onDelete: (dashboard: IAnalyticsDashboard) => void;
  onDuplicate?: (dashboard: IAnalyticsDashboard) => void;
};

export const AnalyticsDashboardCard = observer(function AnalyticsDashboardCard({
  dashboard,
  workspaceSlug,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const { t } = useTranslation();
  const router = useAppRouter();
  const { addDashboardToFavorites, removeDashboardFromFavorites } = useAnalyticsDashboard();

  const handleCardClick = () => {
    void router.push(`/${workspaceSlug}/dashboards/${dashboard.id}`);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dashboard.is_favorite) {
      void removeDashboardFromFavorites(workspaceSlug, dashboard.id);
    } else {
      void addDashboardToFavorites(workspaceSlug, dashboard.id);
    }
  };

  return (
    <div
      className="group relative flex cursor-pointer flex-col rounded-lg border border-custom-border-200 bg-custom-background-100 p-4 transition-all hover:shadow-custom-shadow-4xs"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleCardClick();
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-custom-primary-100/10">
            <DashboardIcon className="h-5 w-5 text-custom-primary-100" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-custom-text-100">{dashboard.name}</h3>
            {dashboard.is_default && <span className="text-xs text-custom-text-300">{t("analytics_dashboard.default")}</span>}
          </div>
        </div>

        {/* Favorite star + Actions menu */}
        <div className="flex items-center gap-1">
          <FavoriteStar onClick={handleToggleFavorite} selected={dashboard.is_favorite} />
          <div className="relative flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-custom-background-80"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreHorizontal className="h-4 w-4 text-custom-text-300" />
            </button>
            <div className="absolute right-0 top-full z-10 mt-1 hidden w-36 rounded-md border border-custom-border-200 bg-custom-background-100 py-1 shadow-custom-shadow-rg group-hover:block">
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-custom-text-200 hover:bg-custom-background-80"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(dashboard);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("analytics_dashboard.edit")}
              </button>
              {onDuplicate && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-custom-text-200 hover:bg-custom-background-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(dashboard);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t("analytics_dashboard.duplicate")}
                </button>
              )}
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-custom-background-80"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(dashboard);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("analytics_dashboard.delete")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {dashboard.description && (
        <p className="mb-3 line-clamp-2 text-sm text-custom-text-300">{dashboard.description}</p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center gap-4 text-xs text-custom-text-300">
        <span>{t("analytics_dashboard.widgets", { count: dashboard.widget_count })}</span>
        {dashboard.config?.project_ids?.length > 0 && (
          <span>{t("analytics_dashboard.projects", { count: dashboard.config.project_ids.length })}</span>
        )}
      </div>
    </div>
  );
});
