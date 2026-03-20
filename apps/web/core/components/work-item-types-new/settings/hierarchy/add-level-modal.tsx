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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { Button } from "@plane/propel/button";
// components
import { IssueTypeDropdown } from "@/components/work-item-types/dropdowns/issue-type";
// plane web imports
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";

type Props = {
  handleClose: () => void;
  isOpen: boolean;
  levelToAddTo: number;
};

export const AddWorkItemTypeHierarchyLevelModal = observer(function AddWorkItemTypeHierarchyLevelModal({
  handleClose: propHandleClose,
  isOpen,
  levelToAddTo,
}: Props) {
  // states
  const [loader, setLoader] = useState(false);
  const [workItemTypeId, setWorkItemTypeId] = useState<string | null>(null);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkItemTypesByWorkspaceSlug } = useWorkspaceWorkItemTypes();
  const { getWorkItemType } = useWorkItemType();
  // derived values
  const workItemTypes = workspaceSlug
    ? getWorkItemTypesByWorkspaceSlug(workspaceSlug).filter((t) => t.level === 0)
    : [];
  // translation
  const { t } = useTranslation();
  // modal close callback
  const handleClose = () => {
    propHandleClose();
    setTimeout(() => {
      setWorkItemTypeId(null);
      setLoader(false);
    }, 350);
  };
  // add callback
  const handleAdd = async () => {
    if (!workItemTypeId) return null;
    const workItemType = getWorkItemType(workItemTypeId);
    if (!workItemType) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("work_item_type_hierarchy.add_level_modal.not_found_toast.title"),
        message: t("work_item_type_hierarchy.add_level_modal.not_found_toast.message"),
      });
      return;
    }

    try {
      setLoader(true);
      await workItemType.updateType(
        {
          level: levelToAddTo,
        },
        false
      );
      handleClose();
    } catch (error) {
      console.error("Failed to add work item type to hierarchy:", error);
      if (typeof error === "object" && error !== null && !Array.isArray(error) && "level" in error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_type_hierarchy.add_level_modal.invalid_level_toast.title"),
          message: t("work_item_type_hierarchy.add_level_modal.invalid_level_toast.message", {
            type_name: workItemType.name,
            level: levelToAddTo,
          }),
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_type_hierarchy.add_level_modal.error_toast.title"),
          message: t("work_item_type_hierarchy.add_level_modal.error_toast.message"),
        });
      }
    } finally {
      setLoader(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XL}>
      <div className="px-4 py-3 flex flex-col gap-y-3">
        <h5 className="text-h5-medium">{t("work_item_type_hierarchy.add_level_modal.title")}</h5>
        {workItemTypes.length === 0 ? (
          <EmptyStateCompact
            assetKey="work-item"
            title={t("work_item_type_hierarchy.add_level_modal.empty_state.title")}
            description={t("work_item_type_hierarchy.add_level_modal.empty_state.description")}
            rootClassName="py-6"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-body-xs-medium">{t("work_item_type_hierarchy.add_level_modal.work_item_type")}</p>
            <IssueTypeDropdown
              allWorkItemTypes={workItemTypes}
              handleChange={setWorkItemTypeId}
              selectedWorkItemTypeId={workItemTypeId}
              buttonClassName="py-2 px-3 rounded-md"
              noChevron={false}
              showOnlyActiveWorkItemTypes={false}
            />
          </div>
        )}
        <hr className="border-[0.5px] border-subtle" />
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" onClick={() => handleAdd()} disabled={!workItemTypeId} loading={loader}>
            {t("common.add")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
