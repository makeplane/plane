/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Archive, Trash2, X } from "lucide-react";
// i18n
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
// types
import type { TBulkIssueProperties } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { BulkDeleteConfirmationModal } from "./delete-modal";
import { IssueBulkOperationsProperties } from "./properties";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot = observer(function IssueBulkOperationsRoot(props: Props) {
  const { className, selectionHelpers } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // i18n
  const { t } = useTranslation();
  // platform
  const { isMobile } = usePlatformOS();
  // store hooks
  const { isSelectionActive, selectedEntityIds, clearSelection } = useMultipleSelectStore();
  const storeType = useIssueStoreType();
  const { issues } = useIssues(storeType);
  // states
  const [properties, setProperties] = useState<Partial<TBulkIssueProperties>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // derived values
  const selectedCount = selectedEntityIds.length;
  const hasChanges = Object.keys(properties).length > 0;
  // the archived issues store intentionally exposes `archiveBulkIssues` as undefined
  const canArchive = typeof issues.archiveBulkIssues === "function";

  const handleClearSelection = () => {
    clearSelection();
    setProperties({});
  };

  const handlePropertiesChange = (data: Partial<TBulkIssueProperties>) =>
    setProperties((prev) => ({ ...prev, ...data }));

  const handleEntityLabel = () => t("issue.label", { count: selectedCount });

  const handleUpdate = async () => {
    if (!workspaceSlug || !projectId || !hasChanges || selectedCount === 0) return;
    setIsUpdating(true);
    try {
      await issues.bulkUpdateProperties(workspaceSlug.toString(), projectId.toString(), {
        issue_ids: selectedEntityIds,
        properties,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("entity.update.success", { entity: handleEntityLabel() }),
      });
      handleClearSelection();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error"),
        message: t("entity.update.failed", { entity: handleEntityLabel() }),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (!workspaceSlug || !projectId || !canArchive || selectedCount === 0) return;
    setIsArchiving(true);
    try {
      await issues.archiveBulkIssues?.(workspaceSlug.toString(), projectId.toString(), selectedEntityIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("bulk_operations.archive_success"),
      });
      handleClearSelection();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error"),
        message: t("common.something_went_wrong"),
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !projectId || selectedCount === 0) return;
    setIsDeleting(true);
    try {
      await issues.removeBulkIssues(workspaceSlug.toString(), projectId.toString(), selectedEntityIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("entity.delete.success", { entity: handleEntityLabel() }),
      });
      setIsDeleteModalOpen(false);
      handleClearSelection();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error"),
        message: t("entity.delete.failed", { entity: handleEntityLabel() }),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = isUpdating || isArchiving || isDeleting;

  if (!isSelectionActive || selectionHelpers.isSelectionDisabled) return null;
  if (!workspaceSlug || !projectId) return null;

  return (
    <>
      <BulkDeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={handleDelete}
      />
      <div className={cn("sticky bottom-0 left-0 z-[2] flex w-full justify-center px-3.5 pb-3", className)}>
        <div className="flex w-full items-center gap-3 rounded-md border-[0.5px] border-strong bg-layer-1 px-3.5 py-2 shadow-md">
          {/* selection count + clear */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <Tooltip tooltipContent={t("bulk_operations.clear_selection")} isMobile={isMobile}>
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={isBusy}
                className="grid place-items-center rounded p-1 text-secondary hover:bg-layer-2 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </Tooltip>
            <span className="whitespace-nowrap text-sm font-medium text-primary">
              {t("bulk_operations.selection_count", { count: selectedCount })}
            </span>
          </div>
          {/* editable properties */}
          <div className="vertical-scrollbar horizontal-scrollbar scrollbar-sm flex min-w-0 flex-1 items-center overflow-x-auto">
            <IssueBulkOperationsProperties
              projectId={projectId.toString()}
              properties={properties}
              handleChange={handlePropertiesChange}
              disabled={isBusy}
            />
          </div>
          {/* actions */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdate}
              disabled={!hasChanges || isBusy}
              loading={isUpdating}
            >
              {t("common.update")}
            </Button>
            {canArchive && (
              <Tooltip tooltipContent={t("common.archive")} isMobile={isMobile}>
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isBusy}
                  className="grid place-items-center rounded border-[0.5px] border-strong p-1.5 text-secondary hover:bg-layer-2 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
            <Tooltip tooltipContent={t("common.delete")} isMobile={isMobile}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isBusy}
                className="grid place-items-center rounded border-[0.5px] border-strong p-1.5 text-danger-primary hover:bg-danger-subtle disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
});
