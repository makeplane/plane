"use client";

import React, { useMemo } from "react";
import merge from "lodash/merge";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TWorkItemTemplateForm, PartialDeep, TWorkItemTemplateFormData } from "@plane/types";
import { Button } from "@plane/ui";
import { cn, TWorkItemSanitizationResult } from "@plane/utils";
// plane web imports
import { IssueAdditionalProperties } from "@/plane-web/components/issues";
import { COMMON_BUTTON_CLASS_NAME } from "@/plane-web/components/templates/settings/common";
// local imports
import { DefaultWorkItemTemplateProperties } from "./default-properties";
import { SelectionDropdown } from "./selection-dropdown";
import { TemplateDetails } from "./template-details";
import { WorkItemDetails } from "./work-item-details";

export enum EWorkItemFormOperation {
  CREATE = "create",
  UPDATE = "update",
}

export type TWorkItemTemplateFormSubmitData = {
  data: TWorkItemTemplateForm;
};

type TWorkItemTemplateFormRootProps = {
  currentLevel: ETemplateLevel;
  operation: EWorkItemFormOperation;
  preloadedData?: PartialDeep<TWorkItemTemplateForm>;
  templateInvalidIds?: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"];
  handleTemplateInvalidIdsChange: <K extends keyof TWorkItemTemplateFormData>(
    key: K,
    invalidIds: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"][K]
  ) => void;
  handleFormCancel: () => void;
  handleFormSubmit: (data: TWorkItemTemplateFormSubmitData) => Promise<void>;
};

const DEFAULT_WORK_ITEM_TEMPLATE_FORM_VALUES: TWorkItemTemplateForm = {
  template: {
    id: "",
    name: "",
    short_description: "",
  },
  work_item: {
    name: "",
    description_html: "",
    project_id: null,
    type_id: null,
    state_id: "",
    priority: "none",
    assignee_ids: [],
    label_ids: [],
    module_ids: [],
  },
};

export const WorkItemTemplateFormRoot: React.FC<TWorkItemTemplateFormRootProps> = observer(
  (props: TWorkItemTemplateFormRootProps) => {
    const {
      currentLevel,
      operation,
      preloadedData,
      templateInvalidIds,
      handleTemplateInvalidIdsChange,
      handleFormCancel,
      handleFormSubmit,
    } = props;
    // router
    const { workspaceSlug } = useParams();
    // plane hooks
    const { t } = useTranslation();
    // form state
    const defaultValueForReset = useMemo(
      () =>
        preloadedData
          ? merge({}, DEFAULT_WORK_ITEM_TEMPLATE_FORM_VALUES, preloadedData)
          : DEFAULT_WORK_ITEM_TEMPLATE_FORM_VALUES,
      [preloadedData]
    );
    const methods = useForm<TWorkItemTemplateForm>({
      defaultValues: defaultValueForReset,
    });
    const {
      handleSubmit,
      watch,
      formState: { isSubmitting },
    } = methods;
    // derived values
    const projectId = watch("work_item.project_id");

    const onSubmit = async (data: TWorkItemTemplateForm) => {
      await handleFormSubmit({ data });
    };

    return (
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Template Section */}
          <div className="space-y-4 w-full max-w-4xl px-page-x py-page-y md:p-9 mx-auto">
            <TemplateDetails />
          </div>

          <div className="bg-custom-background-90/40 border-t border-custom-border-100 size-full">
            <div className="w-full max-w-4xl px-page-x py-page-y md:p-9 mx-auto">
              {/* Work Item Properties Section */}
              <div className="space-y-2">
                {/* Project and Issue Type Selection */}
                <SelectionDropdown
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={projectId}
                  templateId={preloadedData?.template?.id}
                  defaultValueForReset={defaultValueForReset}
                  currentLevel={currentLevel}
                />

                {/* Work Item Details */}
                <div className="flex flex-col gap-y-4 py-4 w-full">
                  <WorkItemDetails workspaceSlug={workspaceSlug?.toString()} projectId={projectId} />
                </div>

                {/* Additional Properties */}
                {projectId && (
                  <div className="space-y-3 py-4">
                    {projectId && (
                      <IssueAdditionalProperties
                        issueId={undefined}
                        issueTypeId={watch("work_item.type_id")}
                        projectId={projectId}
                        workspaceSlug={workspaceSlug?.toString()}
                      />
                    )}
                  </div>
                )}

                {/* Default Properties */}
                <DefaultWorkItemTemplateProperties
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={projectId}
                  currentLevel={currentLevel}
                  templateInvalidIds={templateInvalidIds}
                  handleTemplateInvalidIdsChange={handleTemplateInvalidIdsChange}
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-8 mt-8 border-t border-custom-border-200">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  className={cn(COMMON_BUTTON_CLASS_NAME)}
                  onClick={handleFormCancel}
                >
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" type="submit" size="sm" className={cn("shadow-sm")} loading={isSubmitting}>
                  {isSubmitting
                    ? t("common.confirming")
                    : operation === EWorkItemFormOperation.CREATE
                      ? t("templates.settings.form.work_item.button.create")
                      : t("templates.settings.form.work_item.button.update")}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    );
  }
);
