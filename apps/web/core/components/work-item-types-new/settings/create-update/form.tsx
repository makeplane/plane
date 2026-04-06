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
import { Button } from "@plane/propel/button";
import { InfoIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TWorkItemType } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { IssueTypeIconPicker } from "../common/icon-picker";
import { WorkItemTypeCreateUpdateLevelSelect } from "./level-select";
import type { WorkItemTypeCreateUpdatePermissions } from "./types";

type Props = {
  formData: Partial<TWorkItemType>;
  isSubmitting: boolean;
  handleFormDataChange: <T extends keyof TWorkItemType>(key: T, value: TWorkItemType[T]) => void;
  handleModalClose: () => void;
  handleFormSubmit: () => Promise<void>;
  permissions?: WorkItemTypeCreateUpdatePermissions;
};

export const CreateOrUpdateWorkItemTypeForm = observer(function CreateOrUpdateWorkItemTypeForm(props: Props) {
  const { formData, isSubmitting, handleFormDataChange, handleModalClose, handleFormSubmit, permissions } = props;
  // state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const isWorkItemTypeHierarchyFlagAvailable = useFlag(workspaceSlug, "WORKITEM_TYPE_HIERARCHY", false);
  const isWorkItemHierarchyFeatureEnabled = isWorkspaceFeatureEnabled(
    EWorkspaceFeatures.IS_WORK_ITEM_HIERARCHY_ENABLED
  );
  // plane hooks
  const { t } = useTranslation();

  const validateForm = (data: Partial<TWorkItemType>) => {
    const newErrors: { name?: string } = {};
    if (!data.name || data.name.trim() === "") {
      newErrors.name = t("common.errors.entity_required", { entity: t("common.name") });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIssueTypeFormSubmit = async (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (validateForm(formData)) {
      await handleFormSubmit();
    }
  };

  const handleNameChange = (value: string) => {
    handleFormDataChange("name", value);
    validateForm({ ...formData, name: value });
  };

  return (
    <form onSubmit={handleIssueTypeFormSubmit}>
      <div className="space-y-3 p-5 pb-2">
        <div className={"flex items-center gap-2 w-full"}>
          <IssueTypeIconPicker
            isOpen={isEmojiPickerOpen}
            handleToggle={(val: boolean) => setIsEmojiPickerOpen(val)}
            icon_props={formData?.logo_props?.icon}
            className="flex items-center justify-center shrink-0"
            iconContainerClassName="flex items-center justify-center"
            onChange={(value) => {
              handleFormDataChange("logo_props", {
                in_use: "icon",
                icon: value,
              });
            }}
            size="xl"
          />
          <div className="relative grow w-full">
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t("work_item_types.create_update.form.name.placeholder")}
              className={cn("w-full resize-none text-body-sm-regular border-subtle-1", {
                "border-danger-strong": errors?.name,
              })}
              hasError={Boolean(errors.name)}
              tabIndex={1}
              autoFocus
              disabled={permissions?.canChangeName === false}
            />
            {errors?.name && (
              <Tooltip tooltipContent={errors?.name} position="bottom">
                <div className="shrink-0 size-3.5 overflow-hidden mr-3 flex justify-center items-center text-danger-primary absolute top-1/2 -translate-y-1/2 right-0">
                  <InfoIcon height={14} width={14} />
                </div>
              </Tooltip>
            )}
          </div>
        </div>
        <TextArea
          id="description"
          name="description"
          value={formData.description ?? undefined}
          onChange={(e) => handleFormDataChange("description", e.target.value)}
          placeholder={t("work_item_types.create_update.form.description.placeholder")}
          className="resize-none min-h-24 text-body-xs-regular"
          tabIndex={2}
        />
        {isWorkItemTypeHierarchyFlagAvailable && isWorkItemHierarchyFeatureEnabled && (
          <div className="mt-4">
            <WorkItemTypeCreateUpdateLevelSelect
              value={formData.level}
              onChange={(value) => handleFormDataChange("level", value)}
            />
          </div>
        )}
      </div>
      <div className="mx-5 py-3 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={handleModalClose} tabIndex={3}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleIssueTypeFormSubmit}
            loading={isSubmitting}
            tabIndex={4}
          >
            {formData.id ? t("work_item_types.update.button") : t("work_item_types.create.button")}
          </Button>
        </div>
      </div>
    </form>
  );
});
