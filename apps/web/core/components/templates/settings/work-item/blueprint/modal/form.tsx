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

import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TIssuePropertyValues, TWorkItemBlueprintFormData } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { COMMON_BUTTON_CLASS_NAME } from "@/components/templates/settings/common/helpers";
// local imports
import type {
  TWorkItemBlueprintPropertiesBaseProps,
  TWorkItemBlueprintWithAdditionalPropsData,
  TWorkItemBlueprintWithMobxData,
} from "../form/common";
import { WorkItemBlueprintPropertiesWithAdditionalProps } from "../form/properties-with-additional-props";
import { WorkItemBlueprintPropertiesWithMobx } from "../form/properties-with-mobx";

export type TCreateUpdateWorkItemBlueprintFormProps = Omit<
  TWorkItemBlueprintPropertiesBaseProps<TWorkItemBlueprintFormData>,
  "fieldPaths"
> & {
  onClose: () => void;
  onSubmit: (data: TWorkItemBlueprintFormData, customPropertyValues: TIssuePropertyValues) => void;
  title?: string;
} & (TWorkItemBlueprintWithAdditionalPropsData | TWorkItemBlueprintWithMobxData);

// Note: The UUID is generated once at module load time, not on every render.
export const DEFAULT_WORK_ITEM_BLUEPRINT_FORM_VALUES: TWorkItemBlueprintFormData = {
  id: uuidv4(),
  name: "",
  description_html: "",
  project_id: null,
  type_id: null,
  state_id: null,
  priority: "none",
  assignee_ids: [],
  label_ids: [],
  module_ids: [],
};

export const CreateUpdateWorkItemBlueprintForm = observer(function CreateUpdateWorkItemBlueprintForm(
  props: TCreateUpdateWorkItemBlueprintFormProps
) {
  const { onClose, onSubmit, title, usePropsForAdditionalData } = props;
  // plane hooks
  const { t } = useTranslation();
  // form state
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useFormContext<TWorkItemBlueprintFormData>();
  // context hooks
  const { issuePropertyValues } = useIssueModal();

  const handleFormSubmit = (data: TWorkItemBlueprintFormData) => {
    onSubmit(data, issuePropertyValues);
  };

  return (
    <div className="size-full py-5">
      {/* Form Title */}
      {title && <h3 className="text-xl font-medium text-secondary px-5 pb-4">{title}</h3>}
      {/* Work Item Properties Section */}
      <div className="space-y-2 px-5">
        {usePropsForAdditionalData ? (
          <WorkItemBlueprintPropertiesWithAdditionalProps<TWorkItemBlueprintFormData>
            fieldPaths={{
              assigneeIds: "assignee_ids",
              description: "description_html",
              issueTypeId: "type_id",
              labelIds: "label_ids",
              moduleIds: "module_ids",
              name: "name",
              priority: "priority",
              projectId: "project_id",
              state: "state_id",
            }}
            {...props}
          />
        ) : (
          <WorkItemBlueprintPropertiesWithMobx<TWorkItemBlueprintFormData>
            fieldPaths={{
              assigneeIds: "assignee_ids",
              description: "description_html",
              issueTypeId: "type_id",
              labelIds: "label_ids",
              moduleIds: "module_ids",
              name: "name",
              priority: "priority",
              projectId: "project_id",
              state: "state_id",
            }}
            {...props}
          />
        )}
      </div>
      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-5 border-t border-subtle px-5">
        <Button variant="secondary" size="lg" className={cn(COMMON_BUTTON_CLASS_NAME)} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="primary"
          size="lg"
          className={cn("shadow-sm")}
          loading={isSubmitting}
          onClick={handleSubmit(handleFormSubmit)}
        >
          {isSubmitting ? t("common.confirming") : t("save")}
        </Button>
      </div>
    </div>
  );
});
