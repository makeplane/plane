/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";
// ui
import { Button } from "@makeplane/propel/components/button";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
// components
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// hooks
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot = observer(function IssueBulkOperationsRoot(props: Props) {
  const { className, selectionHelpers } = props;
  // translation
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const storeType = useIssueStoreType();
  const { issues } = useIssues(storeType);
  const { selectedEntityIds } = useMultipleSelectStore();
  // state
  const [isUpdating, setIsUpdating] = useState(false);
  // derived values
  const { handleClearSelection, handleSelectAll, isAllSelected, isSelectionDisabled } = selectionHelpers;
  const selectedCount = selectedEntityIds.length;

  if (isSelectionDisabled || selectedCount === 0) return null;

  const handleChangeStatus = async (stateId: string) => {
    if (!workspaceSlug || !projectId) return;
    if (!("bulkUpdateState" in issues)) return;
    setIsUpdating(true);
    try {
      await issues.bulkUpdateState(workspaceSlug.toString(), projectId.toString(), selectedEntityIds, stateId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("bulk_operations.toolbar.update_success"),
      });
      handleClearSelection();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("bulk_operations.toolbar.update_error"),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={cn("bulk-operations-root relative bottom-[280px] left-0 z-[2] flex justify-center px-3.5", className)}
    >
      <div className="shadow-lg flex items-center gap-3 rounded-lg border border-subtle bg-surface-1 px-4 py-2.5">
        <span className="text-sm font-medium whitespace-nowrap text-primary">
          {t("bulk_operations.toolbar.selected_count", { count: selectedCount })}
        </span>

        <div className="bg-subtle h-4 w-px" />

        <button
          type="button"
          className="text-sm font-medium whitespace-nowrap text-secondary hover:text-primary"
          onClick={handleSelectAll}
          disabled={isUpdating}
        >
          {isAllSelected ? t("bulk_operations.toolbar.clear_selection") : t("bulk_operations.toolbar.select_all")}
        </button>

        <div className="bg-subtle h-4 w-px" />

        <StateDropdown
          projectId={projectId?.toString()}
          value={undefined}
          onChange={handleChangeStatus}
          buttonVariant="border-with-text"
          buttonContainerClassName="min-w-[10rem]"
          disabled={isUpdating}
          placeholder={t("bulk_operations.toolbar.change_status")}
        />

        <Button
          variant="ghost"
          size="sm"
          stretch="auto"
          onClick={handleClearSelection}
          disabled={isUpdating}
          label={t("bulk_operations.toolbar.clear_selection")}
          icon={<X className="size-4" />}
          nativeButton
        />
      </div>
    </div>
  );
});
