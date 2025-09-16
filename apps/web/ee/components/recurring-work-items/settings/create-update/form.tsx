"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import merge from "lodash/merge";
import { observer } from "mobx-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { usePreventOutsideClick } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { PartialDeep, EUserProjectRoles, TRecurringWorkItemForm, TWorkItemBlueprintFormData } from "@plane/types";
import { Button } from "@plane/ui";
import { cn, getDate, renderFormattedPayloadDate, TWorkItemSanitizationResult } from "@plane/utils";
// hooks
import { DateDropdown } from "@/components/dropdowns/date";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import {
  COMMON_BUTTON_CLASS_NAME,
  COMMON_ERROR_CLASS_NAME,
} from "@/plane-web/components/recurring-work-items/settings/common/helpers";
import { DiscardModal } from "@/plane-web/components/templates/settings/discard-modal";
import { WorkItemBlueprintPropertiesWithMobx } from "@/plane-web/components/templates/settings/work-item/blueprint/form/properties-with-mobx";
import { DEFAULT_WORK_ITEM_BLUEPRINT_FORM_VALUES } from "@/plane-web/components/templates/settings/work-item/blueprint/modal/form";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
// local imports
import { IntervalDropdown } from "./interval-dropdown";

export enum ERecurringWorkItemFormOperation {
  CREATE = "create",
  UPDATE = "update",
}

export type TRecurringWorkItemFormSubmitData = {
  data: TRecurringWorkItemForm;
};

type TRecurringWorkItemFormRootProps = {
  handleFormCancel: () => void;
  handleFormSubmit: (data: TRecurringWorkItemFormSubmitData) => Promise<void>;
  handleRecurringWorkItemInvalidIdsChange: <K extends keyof TWorkItemBlueprintFormData>(
    key: K,
    invalidIds: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"][K]
  ) => void;
  operation: ERecurringWorkItemFormOperation;
  preloadedData?: PartialDeep<TRecurringWorkItemForm>;

  recurringWorkItemInvalidIds?: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"];
  workspaceSlug: string;
};

const DEFAULT_RECURRING_WORK_ITEM_FORM_VALUES: Partial<TRecurringWorkItemForm> = {
  id: undefined,
  enabled: true,
  start_at: undefined,
  end_at: null,
  interval_type: undefined,
  workitem_blueprint: DEFAULT_WORK_ITEM_BLUEPRINT_FORM_VALUES,
};

export const RecurringWorkItemFormRoot: React.FC<TRecurringWorkItemFormRootProps> = observer(
  (props: TRecurringWorkItemFormRootProps) => {
    const {
      handleFormCancel,
      handleFormSubmit,
      handleRecurringWorkItemInvalidIdsChange,
      operation,
      preloadedData,
      recurringWorkItemInvalidIds,
      workspaceSlug,
    } = props;
    const ref = useRef<HTMLFormElement>(null);
    // router
    const router = useAppRouter();
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
          ? merge({}, DEFAULT_RECURRING_WORK_ITEM_FORM_VALUES, preloadedData)
          : DEFAULT_RECURRING_WORK_ITEM_FORM_VALUES,
      [preloadedData]
    );
    const methods = useForm<TRecurringWorkItemForm>({
      defaultValues: defaultValueForReset,
    });
    const {
      control,
      formState: { isSubmitting, isDirty, errors },
      handleSubmit,
      reset,
      watch,
    } = methods;
    // derived values
    const projectId = watch("workitem_blueprint.project_id");
    const hasProjectAdminPermission =
      !!projectId &&
      allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
    const allowLabelCreation = hasProjectAdminPermission;
    const minDate = getDate(watch("start_at"));
    minDate?.setDate(minDate.getDate());
    const maxDate = getDate(watch("end_at"));
    maxDate?.setDate(maxDate.getDate());

    const onSubmit = async (data: TRecurringWorkItemForm) => {
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
        const recurringWorkItemData = watch();
        // Get default state id and issue type id for the project
        const defaultStateId = getProjectDefaultStateId(projectId);
        const defaultIssueTypeId = getProjectDefaultWorkItemTypeId(projectId);

        reset({
          ...recurringWorkItemData,
          workitem_blueprint: {
            ...defaultValueForReset.workitem_blueprint,
            project_id: projectId,
            name: recurringWorkItemData.workitem_blueprint.name,
            description_html: recurringWorkItemData.workitem_blueprint.description_html,
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
            <div className="border-t border-custom-border-100 size-full">
              <div className="w-full max-w-4xl py-page-y">
                {/* Work Item Properties Section */}
                <div className="space-y-2">
                  {/* Work Item Properties */}
                  <WorkItemBlueprintPropertiesWithMobx<TRecurringWorkItemForm>
                    allowProjectSelection={false}
                    allowLabelCreation={allowLabelCreation}
                    fieldPaths={{
                      projectId: "workitem_blueprint.project_id",
                      issueTypeId: "workitem_blueprint.type_id",
                      name: "workitem_blueprint.name",
                      description: "workitem_blueprint.description_html",
                      state: "workitem_blueprint.state_id",
                      priority: "workitem_blueprint.priority",
                      assigneeIds: "workitem_blueprint.assignee_ids",
                      labelIds: "workitem_blueprint.label_ids",
                      moduleIds: "workitem_blueprint.module_ids",
                    }}
                    getProjectById={getProjectById}
                    handleInvalidIdsChange={handleRecurringWorkItemInvalidIdsChange}
                    handleProjectChange={handleProjectChange}
                    inputTextSize="lg"
                    invalidIds={recurringWorkItemInvalidIds}
                    projectId={projectId}
                    projectIds={joinedProjectIds}
                    workspaceSlug={workspaceSlug}
                    usePropsForAdditionalData={false}
                  />
                </div>
                {/* Recurring Interval */}
                <div className="flex flex-col gap-3 py-6 border-t border-custom-border-100">
                  <div className="text-sm font-medium text-custom-text-400">
                    {t("recurring_work_items.settings.form.interval.title")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      rules={{
                        required: {
                          value: true,
                          message: t("recurring_work_items.settings.form.interval.start_date.validation.required"),
                        },
                      }}
                      name="start_at"
                      render={({ field: { value, onChange } }) => (
                        <div className="h-7">
                          <DateDropdown
                            value={value}
                            onChange={(date) => {
                              onChange(date ? renderFormattedPayloadDate(date) : null);
                            }}
                            buttonVariant="border-with-text"
                            minDate={new Date()}
                            maxDate={maxDate ?? undefined}
                            placeholder={t("start_date")}
                            buttonClassName={cn({
                              [COMMON_ERROR_CLASS_NAME]: Boolean(errors.start_at),
                            })}
                          />
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="end_at"
                      render={({ field: { value, onChange } }) => (
                        <div className="h-7">
                          <DateDropdown
                            value={value}
                            onChange={(date) => {
                              onChange(date ? renderFormattedPayloadDate(date) : null);
                            }}
                            buttonVariant="border-with-text"
                            minDate={minDate ?? undefined}
                            placeholder={t("end_date")}
                          />
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="interval_type"
                      rules={{
                        required: {
                          value: true,
                          message: t("recurring_work_items.settings.form.interval.interval_type.validation.required"),
                        },
                      }}
                      render={({ field: { value, onChange } }) => (
                        <div className="h-7">
                          <IntervalDropdown
                            value={value}
                            onChange={onChange}
                            hasError={Boolean(errors.interval_type)}
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2 pt-6 border-t border-custom-border-200">
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    className={cn(COMMON_BUTTON_CLASS_NAME)}
                    onClick={handleFormCancel}
                    disabled={isSubmitting}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button variant="primary" type="submit" size="sm" className={cn("shadow-sm")} loading={isSubmitting}>
                    {isSubmitting
                      ? t("common.confirming")
                      : operation === ERecurringWorkItemFormOperation.CREATE
                        ? t("recurring_work_items.settings.form.button.create")
                        : t("recurring_work_items.settings.form.button.update")}
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
