/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkflowDetail } from "@plane/types";
import { Badge, CustomMenu, ToggleSwitch } from "@plane/ui";
// helpers
import { getWorkflowErrorMessage } from "@/utils/workflow-error";

type TWorkflowItemProps = {
  workflow: IWorkflowDetail;
  assignedTypeNames: string[];
  isEditable: boolean;
  isSelected?: boolean;
  onEdit: () => void;
  onSelect: () => void;
  onToggleActive: (nextValue: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
};

export const WorkflowItem = observer(function WorkflowItem(props: TWorkflowItemProps) {
  const {
    workflow,
    assignedTypeNames,
    isEditable,
    isSelected = false,
    onEdit,
    onSelect,
    onToggleActive,
    onDelete,
  } = props;
  const { t } = useTranslation();

  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async (nextValue: boolean) => {
    setIsToggling(true);
    try {
      await onToggleActive(nextValue);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.workflows.delete.success.title"),
        message: t("project_settings.workflows.delete.success.message"),
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.workflows.delete.error.title"),
        // §7.1 — the default workflow is immutable. The backend says exactly
        // why, and §23.5 requires that message to reach the user.
        message: getWorkflowErrorMessage(error, t("project_settings.workflows.delete.error.message")),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-4 border-b border-subtle px-4 py-3 transition-colors last:border-b-0 ${
        isSelected ? "bg-layer-1" : "hover:bg-layer-100 hover:bg-surface-2"
      }`}
    >
      {/* name + default badge */}
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-14 font-medium text-primary">{workflow.name}</span>
          {workflow.is_default && (
            <Badge variant="accent-primary" size="sm">
              {t("project_settings.workflows.list.default_badge")}
            </Badge>
          )}
        </div>
        {workflow.description ? <span className="truncate text-13 text-tertiary">{workflow.description}</span> : null}
      </button>

      {/* assigned work item types — §23.1 */}
      <div className="hidden w-56 shrink-0 flex-wrap items-center gap-1 md:flex">
        {assignedTypeNames.length === 0 ? (
          <span className="text-13 text-tertiary">{t("project_settings.workflows.list.unassigned_types")}</span>
        ) : (
          assignedTypeNames.map((name) => (
            <Badge key={name} variant="neutral" size="sm">
              {name}
            </Badge>
          ))
        )}
      </div>

      {/* modified date — §23.1 */}
      <div className="hidden w-32 shrink-0 lg:block">
        <span className="text-13 text-tertiary">
          {workflow.updated_at ? new Date(workflow.updated_at).toLocaleDateString() : "—"}
        </span>
      </div>

      {/* active toggle — §23.1 */}
      <div className="flex shrink-0 items-center gap-2">
        <ToggleSwitch
          value={workflow.is_active}
          disabled={!isEditable || isToggling || isDeleting}
          onChange={(value) => {
            void handleToggle(value).catch((error: unknown) => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("common.error"),
                message: getWorkflowErrorMessage(error, t("project_settings.workflows.list.toggle_error")),
              });
            });
          }}
        />
        <span className="w-16 text-12 text-tertiary">
          {workflow.is_active
            ? t("project_settings.workflows.list.active_badge")
            : t("project_settings.workflows.list.inactive_badge")}
        </span>
      </div>

      {/* row actions */}
      {isEditable && (
        <CustomMenu
          ellipsis
          ariaLabel={t("project_settings.workflows.list.row_actions")}
          closeOnSelect
          disabled={isDeleting}
          buttonClassName={isDeleting ? "opacity-50" : undefined}
        >
          <CustomMenu.MenuItem onClick={onEdit}>
            <span className="flex items-center justify-start gap-2">
              <Pencil className="size-4" />
              <span>{t("common.edit")}</span>
            </span>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => void handleDelete()} disabled={workflow.is_default}>
            <span
              className={`flex items-center justify-start gap-2 ${
                workflow.is_default ? "cursor-not-allowed text-danger-primary" : ""
              }`}
            >
              <Trash2 className="size-4" />
              <span>{t("common.delete")}</span>
            </span>
          </CustomMenu.MenuItem>
        </CustomMenu>
      )}
    </div>
  );
});
