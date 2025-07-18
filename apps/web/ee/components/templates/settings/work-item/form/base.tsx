"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import merge from "lodash/merge";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { usePreventOutsideClick } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { TWorkItemTemplateForm, PartialDeep, TWorkItemTemplateFormData } from "@plane/types";
import { Button } from "@plane/ui";
import { cn, TWorkItemSanitizationResult } from "@plane/utils";
// plane web imports
import { useAppRouter } from "@/hooks/use-app-router";
import { IssueAdditionalProperties } from "@/plane-web/components/issues";
import { COMMON_BUTTON_CLASS_NAME } from "@/plane-web/components/templates/settings/common";
// local imports
import { DiscardModal } from "../../discard-modal";
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
    const ref = useRef<HTMLFormElement>(null);
    // router
    const { workspaceSlug } = useParams();
    const router = useAppRouter();
    // ref
    const isDirtyRef = useRef<boolean>(false);
    // state
    const [bubbledHref, setBubbledHref] = useState<string | null>(null);
    const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
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
      formState: { isSubmitting, isDirty },
    } = methods;
    // derived values
    const projectId = watch("work_item.project_id");

    const onSubmit = async (data: TWorkItemTemplateForm) => {
      await handleFormSubmit({ data });
    };

    usePreventOutsideClick(
      ref,
      (anchorElement: HTMLAnchorElement | null) => {
        if (!anchorElement || !anchorElement.href) return;

        if (isDirtyRef.current) {
          setIsDiscardModalOpen(true);
          setBubbledHref(anchorElement.href);
        } else {
          router.push(anchorElement.href);
        }
      },
      ["discard-modal-button"]
    );

    useEffect(() => {
      if (isDirtyRef.current !== isDirty) isDirtyRef.current = isDirty;
    }, [isDirty]);

    return (
      <>
        <DiscardModal
          isOpen={isDiscardModalOpen}
          onClose={() => setIsDiscardModalOpen(false)}
          onDiscard={() => {
            if (bubbledHref) {
              router.push(bubbledHref);
            }
          }}
        />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} ref={ref}>
            {/* Template Section */}
            <div className="space-y-4 w-full max-w-4xl py-page-y">
              <TemplateDetails />
            </div>

            <div className="border-t border-custom-border-100 size-full">
              <div className="w-full max-w-4xl py-page-y">
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
      </>
    );
  }
);
