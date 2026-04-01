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
import { CheckIcon } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { Button, getButtonStyling } from "@plane/propel/button";
import { Combobox } from "@plane/propel/combobox";
import { isObject } from "@plane/utils";
// components
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// plane web imports
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";

type Props = {
  handleClose: () => void;
  isOpen: boolean;
  level: number;
  selectedWorkItemTypeIds?: string[];
};

export const AddWorkItemTypeHierarchyLevelModal = observer(function AddWorkItemTypeHierarchyLevelModal({
  handleClose: propHandleClose,
  isOpen,
  level,
  selectedWorkItemTypeIds: value,
}: Props) {
  // states
  const [loader, setLoader] = useState(false);
  const [workItemTypeIds, setWorkItemTypeIds] = useState<string[]>(value ?? []);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkItemTypesByWorkspaceSlug, updateHierarchy } = useWorkspaceWorkItemTypes();
  const { getWorkItemType } = useWorkItemType();
  // derived values
  const workItemTypes = workspaceSlug ? getWorkItemTypesByWorkspaceSlug(workspaceSlug) : [];
  const isUpdating = !!value;
  // translation
  const { t } = useTranslation();
  // modal close callback
  const handleClose = () => {
    propHandleClose();
    setTimeout(() => {
      setWorkItemTypeIds(value ?? []);
      setLoader(false);
    }, 350);
  };
  // add callback
  const handleSubmit = async () => {
    if (!workspaceSlug) return;
    if (!isUpdating && !workItemTypeIds.length) return;

    try {
      setLoader(true);
      await updateHierarchy(workspaceSlug, {
        level,
        type_ids: workItemTypeIds,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to add work item type to hierarchy:", error);
      if (isObject(error) && "type_id" in error && typeof error.type_id === "string") {
        const workItemType = getWorkItemType(error.type_id);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_type_hierarchy.add_level_modal.invalid_level_toast.title"),
          message: t("work_item_type_hierarchy.add_level_modal.invalid_level_toast.message", {
            type_name: workItemType?.name,
            level,
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

            <Combobox
              multiSelect
              value={workItemTypeIds}
              onValueChange={(v) => {
                if (!Array.isArray(v)) return;
                setWorkItemTypeIds(v);
              }}
            >
              <Combobox.Chips
                className="border border-subtle bg-layer-2 rounded-md px-2 py-1"
                getLabel={(val) => workItemTypes.find((f) => f.id === val)?.name || val}
                renderChip={(val, label) => (
                  <Combobox.Chip value={val} className={getButtonStyling("secondary", "base")}>
                    <div className="flex items-center gap-2">
                      <IssueTypeIdentifier issueTypeId={val} size="xs" />
                      <span className="text-caption-md-regular">{label}</span>
                    </div>
                  </Combobox.Chip>
                )}
              >
                <p className="text-body-xs-regular text-placeholder text-left">
                  {t("work_item_type_hierarchy.add_level_modal.select_placeholder")}
                </p>
              </Combobox.Chips>
              <Combobox.Options
                showSearch
                searchPlaceholder={t("work_item_type_hierarchy.add_level_modal.search_placeholder")}
                className="w-72"
                positionerClassName="z-31"
              >
                {workItemTypes.map((workItemType) => (
                  <Combobox.Option
                    key={workItemType.id}
                    value={workItemType.id}
                    className="flex items-center justify-between gap-2 p-2 hover:bg-layer-transparent-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <IssueTypeIdentifier issueTypeId={workItemType.id} size="xs" />
                      <span className="text-caption-md-regular">{workItemType.name}</span>
                    </div>
                    {workItemTypeIds.includes(workItemType.id) && <CheckIcon className="shrink-0 size-4" />}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </Combobox>
          </div>
        )}
        <hr className="border-[0.5px] border-subtle" />
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleSubmit()}
            disabled={isUpdating ? false : !workItemTypeIds.length}
            loading={loader}
          >
            {isUpdating ? t("common.update") : t("common.add")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
