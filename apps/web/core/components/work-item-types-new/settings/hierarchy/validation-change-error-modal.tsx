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
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { DropdownIcon } from "@plane/propel/icons";
import { Input } from "@plane/propel/input";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { WorkspaceWorkItemTypesService } from "@plane/services";
import type { TValidateLevelChangePayload, TValidateLevelChangeResponse } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
// plane web imports
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";
// services
const workspaceWorkItemTypesService = new WorkspaceWorkItemTypesService();

type WorkItemTypeHierarchyValidationChangeErrorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedLevels: TValidateLevelChangePayload) => Promise<void>;
  updatedLevels: TValidateLevelChangePayload | null;
  violations: TValidateLevelChangeResponse | null;
  workspaceSlug: string | undefined;
};

export const WorkItemTypeHierarchyValidationChangeErrorModal = observer(
  function WorkItemTypeHierarchyValidationChangeErrorModal({
    isOpen,
    onClose,
    onSuccess,
    updatedLevels,
    violations,
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
    const isConfirmTextValid =
      confirmText.toLowerCase() ===
      t("work_item_type_hierarchy.break_hierarchy_modal.confirm_input.placeholder").toLowerCase();
    // handlers
    const handleConfirm = async () => {
      if (!workspaceSlug || !updatedLevels || !isConfirmTextValid || isSubmitting) return;
      try {
        setIsSubmitting(true);
        await workspaceWorkItemTypesService.breakHierarchy(workspaceSlug, updatedLevels);
        await onSuccess(updatedLevels);
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

    if (!violations || !updatedLevels) return null;

    return (
      <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.XL} position={EModalPosition.CENTER}>
        <div className="p-4">
          <div>
            <h3 className="text-h5-medium text-primary">{t("work_item_type_hierarchy.break_hierarchy_modal.title")}</h3>
            <p className="text-body-sm-regular text-secondary mt-1.5">
              {t("work_item_type_hierarchy.break_hierarchy_modal.description", {
                count: Object.keys(violations).length,
              })}
            </p>
          </div>
          <div className="mt-6">
            <p className="text-body-xs-semibold text-tertiary">
              {t("work_item_type_hierarchy.break_hierarchy_modal.content.impacted_areas")}
            </p>
            <div className="mt-2 flex flex-col gap-y-2">
              {Object.entries(violations).map(([typeId, violation]) => {
                const workItemType = getWorkItemType(typeId);

                let totalImpact = 0;
                if (violation.child_violations > 0) totalImpact++;
                if (violation.parent_violations > 0) totalImpact++;

                if (!workItemType || totalImpact === 0) return null;

                return (
                  <Collapsible key={typeId} className="border border-subtle rounded-lg">
                    <CollapsibleTrigger className="bg-layer-2 py-2 px-3 flex items-center justify-between gap-2 w-full rounded-none">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0">
                          <DropdownIcon className="text-secondary -rotate-90 in-data-panel-open:rotate-0 transition-transform" />
                        </span>
                        <span className="shrink-0">
                          <IssueTypeLogo icon_props={workItemType.logo_props?.icon} size="xs" />
                        </span>
                        <p className="text-body-sm-regular text-primary">{workItemType.name}</p>
                      </div>
                      <span className="shrink-0">
                        <Badge variant="neutral" size="sm">
                          {t("work_item_type_hierarchy.break_hierarchy_modal.content.total_impacts", {
                            count: totalImpact,
                          })}
                        </Badge>
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="bg-layer-1 p-3">
                      <div className="flex flex-col gap-y-2 text-body-xs-regular text-secondary">
                        {violation.parent_violations > 0 && (
                          <p>
                            {t("work_item_type_hierarchy.break_hierarchy_modal.content.parent_items", {
                              count: violation.parent_violations,
                            })}
                          </p>
                        )}
                        {violation.child_violations > 0 && (
                          <p>
                            {t("work_item_type_hierarchy.break_hierarchy_modal.content.sub_work_items", {
                              count: violation.child_violations,
                            })}
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
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
                placeholder={t(
                  "work_item_type_hierarchy.break_hierarchy_modal.confirm_input.placeholder"
                ).toLowerCase()}
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
          <div className="mt-6 pt-6 border-t-[0.5px] border-subtle flex items-center justify-end gap-2">
            <Button variant="secondary" size="lg" onClick={onClose}>
              {t("work_item_type_hierarchy.break_hierarchy_modal.cancel_button")}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirm}
              loading={isSubmitting}
              disabled={!isConfirmTextValid}
            >
              {isSubmitting
                ? t("work_item_type_hierarchy.break_hierarchy_modal.confirm_button.loading")
                : t("work_item_type_hierarchy.break_hierarchy_modal.confirm_button.default")}
            </Button>
          </div>
        </div>
      </ModalCore>
    );
  }
);
