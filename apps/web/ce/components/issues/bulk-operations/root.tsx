import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { X, Trash2, Archive, AlertTriangle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { PriorityIcon } from "@plane/propel/icons";
import { EIssuesStoreType, TIssuePriorities, TBulkOperationsPayload } from "@plane/types";
// ui
import { Button, Spinner, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// types
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot = observer(function IssueBulkOperationsRoot(props: Props) {
  const { className, selectionHelpers } = props;
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();

  // store hooks
  const { isSelectionActive, selectedEntityIds, clearSelection } = useMultipleSelectStore();
  const storeType = useIssueStoreType();
  const { issues } = useIssues(storeType);
  const { projectStates } = useProjectState();

  // local state
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isSelectionActive || selectionHelpers.isSelectionDisabled) return null;

  const selectedCount = selectedEntityIds.length;

  const handleBulkUpdate = async (properties: TBulkOperationsPayload["properties"]) => {
    if (!workspaceSlug || !projectId || selectedCount === 0) return;

    setIsUpdating(true);
    try {
      await issues.bulkUpdateProperties(
        workspaceSlug.toString(),
        projectId.toString(),
        {
          issue_ids: selectedEntityIds,
          properties,
        }
      );
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message: `Updated ${selectedCount} work item${selectedCount > 1 ? "s" : ""}`,
      });
    } catch (error) {
      console.error("Failed to bulk update issues:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: "Failed to update work items",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!workspaceSlug || !projectId || selectedCount === 0) return;

    setIsUpdating(true);
    try {
      await issues.removeBulkIssues(
        workspaceSlug.toString(),
        projectId.toString(),
        selectedEntityIds
      );
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message: `Deleted ${selectedCount} work item${selectedCount > 1 ? "s" : ""}`,
      });
      clearSelection();
    } catch (error) {
      console.error("Failed to bulk delete issues:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: "Failed to delete work items",
      });
    } finally {
      setIsUpdating(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!workspaceSlug || !projectId || selectedCount === 0) return;

    setIsUpdating(true);
    try {
      await issues.archiveBulkIssues(
        workspaceSlug.toString(),
        projectId.toString(),
        selectedEntityIds
      );
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success") || "Success",
        message: `Archived ${selectedCount} work item${selectedCount > 1 ? "s" : ""}`,
      });
      clearSelection();
    } catch (error) {
      console.error("Failed to bulk archive issues:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error") || "Error",
        message: "Failed to archive work items. Make sure all items are completed or cancelled.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = (priority: TIssuePriorities) => {
    handleBulkUpdate({ priority });
  };

  const handleStateChange = (stateId: string) => {
    handleBulkUpdate({ state_id: stateId });
  };

  return (
    <div className={cn("sticky bottom-0 left-0 z-[2] px-3.5 pb-3", className)}>
      <div className="h-14 w-full bg-layer-1 border border-subtle shadow-lg py-3 px-4 flex items-center justify-between gap-3 rounded-lg">
        {/* Left side - Selection info and clear */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => clearSelection()}
            className="flex items-center justify-center size-7 rounded hover:bg-layer-2 transition-colors"
            disabled={isUpdating}
          >
            <X className="size-4 text-secondary" />
          </button>
          <span className="text-sm font-medium text-primary">
            {selectedCount} {t("common.selected") || "selected"}
          </span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {isUpdating && <Spinner className="size-4" />}

          {/* State Dropdown */}
          <CustomMenu
            label={t("common.state") || "State"}
            placement="top"
            maxHeight="md"
            closeOnSelect
            disabled={isUpdating}
            customButton={
              <Button variant="neutral-primary" size="sm" disabled={isUpdating}>
                {t("common.state") || "State"}
              </Button>
            }
          >
            {projectStates?.map((state) => (
              <CustomMenu.MenuItem key={state.id} onClick={() => handleStateChange(state.id)}>
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: state.color }}
                  />
                  <span className="truncate">{state.name}</span>
                </div>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>

          {/* Priority Dropdown */}
          <CustomMenu
            label={t("common.priority") || "Priority"}
            placement="top"
            maxHeight="md"
            closeOnSelect
            disabled={isUpdating}
            customButton={
              <Button variant="neutral-primary" size="sm" disabled={isUpdating}>
                {t("common.priority") || "Priority"}
              </Button>
            }
          >
            {ISSUE_PRIORITIES.map((priority) => (
              <CustomMenu.MenuItem
                key={priority.key}
                onClick={() => handlePriorityChange(priority.key as TIssuePriorities)}
              >
                <div className="flex items-center gap-2">
                  <PriorityIcon priority={priority.key as TIssuePriorities} className="size-3.5" />
                  <span>{priority.title}</span>
                </div>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>

          {/* Archive Button */}
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={handleBulkArchive}
            disabled={isUpdating}
            prependIcon={<Archive className="size-3.5" />}
          >
            {t("common.archive") || "Archive"}
          </Button>

          {/* Delete Button */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 px-2 py-1 bg-danger-muted/20 border border-danger-muted rounded">
              <AlertTriangle className="size-4 text-danger-primary" />
              <span className="text-sm text-danger-primary">{t("common.confirm") || "Confirm"}?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isUpdating}
              >
                {t("common.delete") || "Delete"}
              </Button>
              <Button
                variant="neutral-primary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isUpdating}
              >
                {t("common.cancel") || "Cancel"}
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating}
              prependIcon={<Trash2 className="size-3.5" />}
            >
              {t("common.delete") || "Delete"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
