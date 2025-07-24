"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import merge from "lodash/merge";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import { ETemplateLevel, EUserPermissionsLevel, WORKITEM_TEMPLATE_TRACKER_ELEMENTS } from "@plane/constants";
import { usePreventOutsideClick } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import {
  PartialDeep,
  TWorkItemTemplateForm,
  TWorkItemTemplateFormData,
  TIssuePropertyValues,
  EUserWorkspaceRoles,
  EUserProjectRoles,
} from "@plane/types";
import { Button } from "@plane/ui";
import { cn, TWorkItemSanitizationResult } from "@plane/utils";
// plane web imports
import { useProject, useUserPermissions } from "@/hooks/store";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useAppRouter } from "@/hooks/use-app-router";
import { COMMON_BUTTON_CLASS_NAME } from "@/plane-web/components/templates/settings/common";
import { TemplateDetails } from "@/plane-web/components/templates/settings/common/form/template-details";
import { DiscardModal } from "@/plane-web/components/templates/settings/discard-modal";
import { WorkItemBlueprintListRoot } from "@/plane-web/components/templates/settings/work-item/blueprint/list/root";
import { DEFAULT_WORK_ITEM_BLUEPRINT_FORM_VALUES } from "@/plane-web/components/templates/settings/work-item/blueprint/modal/form";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
// local imports
import { WorkItemBlueprintPropertiesWithMobx } from "./blueprint/form/properties-with-mobx";

export enum EWorkItemFormOperation {
  CREATE = "create",
  UPDATE = "update",
}

export type TWorkItemTemplateFormSubmitData = {
  data: TWorkItemTemplateForm;
};

type TWorkItemTemplateFormRootProps = {
  currentLevel: ETemplateLevel;
  handleFormCancel: () => void;
  handleFormSubmit: (data: TWorkItemTemplateFormSubmitData) => Promise<void>;
  handleTemplateInvalidIdsChange: <K extends keyof TWorkItemTemplateFormData>(
    key: K,
    invalidIds: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"][K]
  ) => void;
  handleWorkItemListCustomPropertyValuesChange: (
    workItemId: string,
    customPropertyValues: TIssuePropertyValues
  ) => void;
  operation: EWorkItemFormOperation;
  preloadedData?: PartialDeep<TWorkItemTemplateForm>;
  subWorkItemCustomPropertyValues?: Record<string, TIssuePropertyValues>;
  templateId?: string;
  templateInvalidIds?: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"];
};

const DEFAULT_WORK_ITEM_TEMPLATE_FORM_VALUES: TWorkItemTemplateForm = {
  template: {
    id: "",
    name: "",
    short_description: "",
  },
  work_item: {
    ...DEFAULT_WORK_ITEM_BLUEPRINT_FORM_VALUES,
    sub_workitems: [],
  },
};

export const WorkItemTemplateFormRoot: React.FC<TWorkItemTemplateFormRootProps> = observer(
  (props: TWorkItemTemplateFormRootProps) => {
    const {
      currentLevel,
      handleFormCancel,
      handleFormSubmit,
      handleTemplateInvalidIdsChange,
      handleWorkItemListCustomPropertyValuesChange,
      operation,
      preloadedData,
      subWorkItemCustomPropertyValues,
      templateId,
      templateInvalidIds,
    } = props;
    const ref = useRef<HTMLFormElement>(null);
    // router
    const router = useAppRouter();
    const { workspaceSlug: routerWorkspaceSlug } = useParams();
    const workspaceSlug = routerWorkspaceSlug?.toString();
    // ref
    const isDirtyRef = useRef<boolean>(false);
    // state
    const [bubbledHref, setBubbledHref] = useState<string | null>(null);
    const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
    // plane hooks
    const { t } = useTranslation();
    // store hooks
    const { allowPermissions } = useUserPermissions();
    const { getProjectDefaultStateId } = useProjectState();
    const { getProjectDefaultWorkItemTypeId } = useIssueTypes();
    const { getProjectById, joinedProjectIds } = useProject();
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
      reset,
      formState: { isSubmitting, isDirty },
    } = methods;
    // derived values
    const projectId = watch("work_item.project_id");
    const hasWorkspaceAdminPermission = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
    const hasProjectAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
    const allowLabelCreation =
      currentLevel === ETemplateLevel.WORKSPACE ? hasWorkspaceAdminPermission : hasProjectAdminPermission;

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

    // Reset the form values when the projectId changes, apart from common fields
    const handleProjectChange = useCallback(
      (projectId: string) => {
        const templateData = watch("template");
        const workItemData = watch("work_item");
        // Get default state id and issue type id for the project
        const defaultStateId = getProjectDefaultStateId(projectId);
        const defaultIssueTypeId = getProjectDefaultWorkItemTypeId(projectId);

        reset({
          template: templateData,
          work_item: {
            ...defaultValueForReset.work_item,
            project_id: projectId,
            name: workItemData.name,
            description_html: workItemData.description_html,
            state_id: defaultStateId,
            type_id: defaultIssueTypeId,
          },
        });
      },
      [watch, getProjectDefaultStateId, getProjectDefaultWorkItemTypeId, reset, defaultValueForReset]
    );

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
              <TemplateDetails
                fieldPaths={{
                  name: "template.name",
                  shortDescription: "template.short_description",
                }}
                validation={{
                  name: {
                    required: t("templates.settings.form.work_item.template.name.validation.required"),
                    maxLength: t("templates.settings.form.work_item.template.name.validation.maxLength"),
                  },
                }}
                placeholders={{
                  name: t("templates.settings.form.work_item.template.name.placeholder"),
                  shortDescription: t("templates.settings.form.work_item.template.description.placeholder"),
                }}
              />
            </div>
            <div className="border-t border-custom-border-100 size-full">
              <div className="w-full max-w-4xl py-page-y">
                {/* Work Item Properties Section */}
                <div className="space-y-2">
                  {/* Work Item Properties */}
                  <WorkItemBlueprintPropertiesWithMobx<TWorkItemTemplateForm>
                    allowProjectSelection={currentLevel !== ETemplateLevel.PROJECT && !templateId}
                    allowLabelCreation={allowLabelCreation}
                    fieldPaths={{
                      projectId: "work_item.project_id",
                      issueTypeId: "work_item.type_id",
                      name: "work_item.name",
                      description: "work_item.description_html",
                      state: "work_item.state_id",
                      priority: "work_item.priority",
                      assigneeIds: "work_item.assignee_ids",
                      labelIds: "work_item.label_ids",
                      moduleIds: "work_item.module_ids",
                    }}
                    getProjectById={getProjectById}
                    handleInvalidIdsChange={handleTemplateInvalidIdsChange}
                    handleProjectChange={handleProjectChange}
                    inputTextSize="lg"
                    invalidIds={templateInvalidIds}
                    projectId={projectId}
                    projectIds={joinedProjectIds}
                    workspaceSlug={workspaceSlug}
                    usePropsForAdditionalData={false}
                  />
                  {/* Sub Work Items */}
                  <WorkItemBlueprintListRoot<TWorkItemTemplateForm>
                    emptyStateDescription={t("templates.empty_state.no_sub_work_items.description")}
                    getProjectById={getProjectById}
                    handleWorkItemListInvalidIdsChange={(subWorkItemsInvalidIds) => {
                      handleTemplateInvalidIdsChange("sub_workitems", subWorkItemsInvalidIds);
                    }}
                    modalTitle={t("issue.add.sub_issue")}
                    modalInputBorderVariant="primary"
                    projectId={projectId}
                    sectionTitle={t("common.sub_work_items")}
                    setWorkItemListCustomPropertyValues={handleWorkItemListCustomPropertyValuesChange}
                    workItemFieldPath="work_item.sub_workitems"
                    workItemListCustomPropertyValues={subWorkItemCustomPropertyValues}
                    workItemListInvalidIds={templateInvalidIds?.sub_workitems}
                    workspaceSlug={workspaceSlug}
                    usePropsForAdditionalData={false}
                  />
                </div>
                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2 pt-8 border-t border-custom-border-200">
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    className={cn(COMMON_BUTTON_CLASS_NAME)}
                    onClick={handleFormCancel}
                    data-ph-element={
                      currentLevel === ETemplateLevel.WORKSPACE
                        ? WORKITEM_TEMPLATE_TRACKER_ELEMENTS.WORKSPACE_CREATE_UPDATE_FORM_CANCEL_BUTTON
                        : WORKITEM_TEMPLATE_TRACKER_ELEMENTS.PROJECT_CREATE_UPDATE_FORM_CANCEL_BUTTON
                    }
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    size="sm"
                    className={cn("shadow-sm")}
                    loading={isSubmitting}
                    data-ph-element={
                      currentLevel === ETemplateLevel.WORKSPACE
                        ? WORKITEM_TEMPLATE_TRACKER_ELEMENTS.WORKSPACE_CREATE_UPDATE_FORM_SUBMIT_BUTTON
                        : WORKITEM_TEMPLATE_TRACKER_ELEMENTS.PROJECT_CREATE_UPDATE_FORM_SUBMIT_BUTTON
                    }
                  >
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
