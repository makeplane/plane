/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/propel/input";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TValidateLevelChangeResponse } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// plane web imports
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";
// services
import { WorkspaceWorkItemTypesService } from "@plane/services";
const workspaceWorkItemTypesService = new WorkspaceWorkItemTypesService();

type WorkItemTypeHierarchyValidationChangeErrorModalProps = {
  data: TValidateLevelChangeResponse | null;
  isOpen: boolean;
  onClose: () => void;
  level: number;
  workItemTypeId: string;
  workspaceSlug: string | undefined;
};

export const ValidationChangeErrorModal = observer(function ValidationChangeErrorModal({
  data,
  isOpen,
  onClose,
  workItemTypeId,
  level,
  workspaceSlug,
}: WorkItemTypeHierarchyValidationChangeErrorModalProps) {
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  // store hooks
  const { getWorkItemType } = useWorkItemType();
  // translation
  const { t } = useTranslation();
  // derived values
  const workItemType = getWorkItemType(workItemTypeId);
  const isConfirmTextValid =
    confirmText.toLowerCase() ===
    t("work_item_type_hierarchy.break_hierarchy_modal.confirm_input.placeholder").toLowerCase();
  // handlers
  const handleConfirm = async () => {
    if (!workspaceSlug || !workItemType || !isConfirmTextValid || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await workspaceWorkItemTypesService.breakHierarchy(workspaceSlug, {
        type_id: workItemTypeId,
        level,
      });
      await workItemType.updateType({ level }, false);
      workItemType.mutateProperties({ level });
      onClose();
    } catch (error) {
      console.error("Error in breaking hierarchy:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("work_item_type_hierarchy.break_hierarchy_modal.error_toast.title"),
        message: t("work_item_type_hierarchy.break_hierarchy_modal.error_toast.message"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);

  if (!data) return null;

  return (
    <AlertModalCore
      title={t("work_item_type_hierarchy.break_hierarchy_modal.title")}
      content={
        <div>
          <p>
            {t("work_item_type_hierarchy.break_hierarchy_modal.content.intro", {
              workItemTypeName: workItemType?.name,
            })}{" "}
            {data.parent_violations > 0 && (
              <span>
                <b>{data.parent_violations}</b>{" "}
                {t("work_item_type_hierarchy.break_hierarchy_modal.content.parent_items", {
                  count: data.parent_violations,
                })}
                {data.child_violations > 0
                  ? t("work_item_type_hierarchy.break_hierarchy_modal.content.parent_line_suffix_when_also_children")
                  : ""}
              </span>
            )}
            {data.child_violations > 0 && (
              <span>
                <b>{data.child_violations}</b>{" "}
                {t("work_item_type_hierarchy.break_hierarchy_modal.content.child_items", {
                  count: data.child_violations,
                })}
              </span>
            )}
          </p>
          <p className="mt-2">
            {t("work_item_type_hierarchy.break_hierarchy_modal.content.footer", {
              workItemTypeName: workItemType?.name,
            })}
          </p>
          <div className="text-secondary mt-4 flex flex-col gap-y-2">
            <p className="wrap-break-word text-body-xs-regular">
              {t("work_item_type_hierarchy.break_hierarchy_modal.confirm_input.label")}
            </p>
            <Input
              id="confirmText"
              name="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("work_item_type_hierarchy.break_hierarchy_modal.confirm_input.placeholder").toLowerCase()}
              className="w-full"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              autoFocus
            />
          </div>
        </div>
      }
      handleClose={onClose}
      handleSubmit={handleConfirm}
      isSubmitting={isSubmitting}
      isOpen={isOpen}
      isDisabled={!isConfirmTextValid}
      primaryButtonText={{
        loading: t("work_item_type_hierarchy.break_hierarchy_modal.confirm_button.loading"),
        default: t("work_item_type_hierarchy.break_hierarchy_modal.confirm_button.default"),
      }}
      secondaryButtonText={t("common.cancel")}
    />
  );
});
