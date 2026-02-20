/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowLeft, Edit2, RefreshCw, Plus } from "lucide-react";
import { DashboardIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";

interface DashboardToolbarProps {
  pageTitle: string;
  description?: string | null;
  isEditMode: boolean;
  onBack: () => void;
  onAddWidget: () => void;
  onRefresh: () => void;
  onToggleEdit: () => void;
}

/** Header toolbar with back-nav, title, and action buttons for a dashboard detail page. */
export const DashboardToolbar = ({
  pageTitle,
  description,
  isEditMode,
  onBack,
  onAddWidget,
  onRefresh,
  onToggleEdit,
}: DashboardToolbarProps) => (
  <div className="flex flex-shrink-0 items-center justify-between border-b border-subtle bg-surface-1 px-4 py-3 relative z-10">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <button
        className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-2"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 text-tertiary" />
      </button>
      <DashboardIcon className="h-5 w-5 text-accent-primary" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold">{pageTitle}</h1>
        {description && (
          <p className="truncate text-sm text-tertiary">{description}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={onAddWidget} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Widget
      </Button>
      <Button variant="link" size="sm" onClick={onRefresh} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
      <Button
        variant={isEditMode ? "primary" : "secondary"}
        size="sm"
        onClick={onToggleEdit}
        className="gap-2"
      >
        <Edit2 className="h-4 w-4" />
        {isEditMode ? "Done" : "Edit"}
      </Button>
    </div>
  </div>
);
