/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { MoreHorizontal, Pencil, Trash2, LayoutDashboard, Lock, Globe } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Menu } from "@plane/propel/menu";
import { useAppRouter } from "@/hooks/use-app-router";
import type { IDashboard } from "@plane/types";

type Props = {
  dashboard: IDashboard;
  workspaceSlug: string;
  onEdit: (dashboard: IDashboard) => void;
  onDelete: (dashboard: IDashboard) => void;
};

export const DashboardCard = observer(function DashboardCard({ dashboard, workspaceSlug, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const router = useAppRouter();

  const handleCardClick = () => {
    void router.push(`/${workspaceSlug}/dashboards/${dashboard.id}`);
  };

  // access: 0 = private, 1 = public
  const isPublic = dashboard.access === 1;

  return (
    <div
      className="group relative flex cursor-pointer flex-col rounded-lg border border-subtle bg-surface-1 p-4 transition-shadow hover:shadow-sm"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleCardClick();
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
            <LayoutDashboard className="h-5 w-5 text-accent-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-primary">{dashboard.name}</h3>
            {/* Access badge */}
            <span className="inline-flex items-center gap-1 text-xs text-secondary mt-0.5">
              {isPublic ? (
                <>
                  <Globe className="h-3 w-3" />
                  {t("analytics_dashboard.access_public")}
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  {t("analytics_dashboard.access_private")}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Actions menu */}
        <div
          role="none"
          className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Menu
            customButton={
              <div className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-1">
                <MoreHorizontal className="h-4 w-4 text-secondary" />
              </div>
            }
          >
            <Menu.MenuItem onClick={() => onEdit(dashboard)}>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Pencil className="h-3.5 w-3.5" />
                {t("analytics_dashboard.context_edit")}
              </div>
            </Menu.MenuItem>
            <Menu.MenuItem onClick={() => onDelete(dashboard)}>
              <div className="flex items-center gap-2 text-sm text-danger-primary">
                <Trash2 className="h-3.5 w-3.5" />
                {t("analytics_dashboard.context_delete")}
              </div>
            </Menu.MenuItem>
          </Menu>
        </div>
      </div>

      {/* Description */}
      {dashboard.description && <p className="mb-3 line-clamp-2 text-sm text-secondary">{dashboard.description}</p>}

      {/* Footer: widget count */}
      {Array.isArray(dashboard.widgets) && (
        <div className="mt-auto text-xs text-tertiary">
          {t("analytics_dashboard.widget_count", { count: dashboard.widgets.length })}
        </div>
      )}
    </div>
  );
});
