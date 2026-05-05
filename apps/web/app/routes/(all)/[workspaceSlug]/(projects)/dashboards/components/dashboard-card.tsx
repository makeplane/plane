/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { MoreHorizontal, Pencil, Trash2, LayoutDashboard, Lock, Globe } from "lucide-react";
import type { IDashboard } from "@plane/types";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  dashboard: IDashboard;
  workspaceSlug: string;
  onEdit: (dashboard: IDashboard) => void;
  onDelete: (dashboard: IDashboard) => void;
};

export const DashboardCard = observer(function DashboardCard({ dashboard, workspaceSlug, onEdit, onDelete }: Props) {
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
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Private
                </>
              )}
            </span>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-1"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-secondary" />
          </button>
          <div className="absolute right-0 top-full z-10 mt-1 hidden w-36 rounded-md border border-subtle bg-surface-1 py-1 shadow-sm group-hover:block">
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-layer-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(dashboard);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-danger-primary hover:bg-layer-1"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(dashboard);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {dashboard.description && <p className="mb-3 line-clamp-2 text-sm text-secondary">{dashboard.description}</p>}

      {/* Footer: widget count */}
      {Array.isArray(dashboard.widgets) && (
        <div className="mt-auto text-xs text-tertiary">
          {dashboard.widgets.length} {dashboard.widgets.length === 1 ? "widget" : "widgets"}
        </div>
      )}
    </div>
  );
});
