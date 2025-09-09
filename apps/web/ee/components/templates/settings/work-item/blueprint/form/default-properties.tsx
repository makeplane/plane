import { useState } from "react";
import { Controller, FieldPath, FieldValues, PathValue, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IModule, IIssueLabel, IState, IUserLite, TWorkItemBlueprintFormData } from "@plane/types";
import { cn, TProjectBlueprintDetails, TWorkItemSanitizationResult } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleDropdownBase } from "@/components/dropdowns/module/base";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { WorkItemStateDropdownBase } from "@/components/dropdowns/state/base";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { IssueLabelSelect } from "@/components/issues/select";
import { WorkItemLabelSelectBase } from "@/components/issues/select/base";
// helpers
import { getNestedError } from "@/helpers/react-hook-form.helper";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { COMMON_BUTTON_CLASS_NAME, COMMON_ERROR_CLASS_NAME } from "@/plane-web/components/templates/settings/common";

type TUseMobxData = {
  usePropsForAdditionalData: false;
};

type TUsePropsData = {
  getLabelById: (labelId: string) => IIssueLabel | null;
  getModuleById: (moduleId: string) => IModule | null;
  getProjectById: (projectId: string | undefined | null) => TProjectBlueprintDetails | undefined;
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  getUserDetails: (userId: string) => IUserLite | undefined;
  labelIds: string[];
  memberIds: string[];
  moduleIds: string[];
  stateIds: string[];
  usePropsForAdditionalData: true;
};

type TDefaultWorkItemBlueprintPropertiesProps<T extends FieldValues> = {
  allowLabelCreation?: boolean;
  createLabel?: (data: Partial<IIssueLabel>) => Promise<IIssueLabel>;
  fieldPaths: {
    state: FieldPath<T>;
    priority: FieldPath<T>;
    assigneeIds: FieldPath<T>;
    labelIds: FieldPath<T>;
    moduleIds: FieldPath<T>;
  };
  handleInvalidIdsChange: <K extends keyof TWorkItemBlueprintFormData>(
    key: K,
    invalidIds: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"][K]
  ) => void;
  invalidIds?: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"];
  projectId: string | undefined | null;
} & (TUseMobxData | TUsePropsData);

export const DefaultWorkItemBlueprintProperties = <T extends FieldValues>(
  props: TDefaultWorkItemBlueprintPropertiesProps<T>
) => {
  const {
    allowLabelCreation = true,
    createLabel,
    fieldPaths,
    handleInvalidIdsChange,
    invalidIds,
    projectId,
    usePropsForAdditionalData,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById: getProjectByIdFromStore } = useProject();
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();
  // derived values
  const projectDetails = usePropsForAdditionalData
    ? props.getProjectById(projectId)
    : getProjectByIdFromStore(projectId);
  const isModuleViewEnabled = projectDetails?.module_view;
  // Get errors for the specific fields
  const stateError = getNestedError(errors, fieldPaths.state);
  const assigneeIdsError = getNestedError(errors, fieldPaths.assigneeIds);
  const labelIdsError = getNestedError(errors, fieldPaths.labelIds);
  const moduleIdsError = getNestedError(errors, fieldPaths.moduleIds);
  // common dropdown props
  const commonStateDropdownProps = {
    alwaysAllowStateChange: true,
    projectId: projectId || undefined,
    buttonClassName: cn(COMMON_BUTTON_CLASS_NAME, {
      [COMMON_ERROR_CLASS_NAME]: Boolean(stateError || invalidIds?.state_id),
    }),
    disabled: !projectId,
  };
  const commonLabelDropdownProps = {
    createLabel: createLabel,
    projectId: projectId || undefined,
    createLabelEnabled: allowLabelCreation,
    buttonClassName: cn(COMMON_BUTTON_CLASS_NAME, {
      [COMMON_ERROR_CLASS_NAME]: Boolean(labelIdsError || (invalidIds?.label_ids && invalidIds?.label_ids?.length > 0)),
    }),
    disabled: !projectId,
  };
  const commonModuleDropdownProps = {
    projectId: projectId || undefined,
    placeholder: t("modules"),
    buttonClassName: cn(COMMON_BUTTON_CLASS_NAME, {
      [COMMON_ERROR_CLASS_NAME]: Boolean(
        moduleIdsError || (invalidIds?.module_ids && invalidIds?.module_ids?.length > 0)
      ),
    }),
    showCount: true,
    disabled: !projectId,
  };

  if (!projectId) return null;
  return (
    <>
      <div className="space-y-3 pt-3 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* State */}
          <Controller
            control={control}
            name={fieldPaths.state}
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                {usePropsForAdditionalData ? (
                  <WorkItemStateDropdownBase
                    {...commonStateDropdownProps}
                    buttonVariant="border-with-text"
                    getStateById={props.getStateById}
                    onChange={(stateId) => {
                      onChange(stateId);
                      handleInvalidIdsChange("state_id", null);
                    }}
                    stateIds={props.stateIds}
                    value={value}
                  />
                ) : (
                  <StateDropdown
                    {...commonStateDropdownProps}
                    buttonVariant="border-with-text"
                    onChange={(stateId) => {
                      onChange(stateId);
                      handleInvalidIdsChange("state_id", null);
                    }}
                    value={value}
                  />
                )}
              </div>
            )}
          />

          {/* Priority */}
          <Controller
            control={control}
            name={fieldPaths.priority}
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <PriorityDropdown
                  value={value}
                  onChange={(priority) => {
                    onChange(priority);
                  }}
                  buttonVariant="border-with-text"
                  buttonClassName={cn("shadow-sm", {
                    [COMMON_BUTTON_CLASS_NAME]: !value || value === "none",
                  })}
                  disabled={!projectId}
                />
              </div>
            )}
          />

          {/* Assignee */}
          <Controller
            control={control}
            name={fieldPaths.assigneeIds}
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <MemberDropdown
                  projectId={projectId || undefined}
                  value={value}
                  onChange={(assigneeIds) => {
                    onChange(assigneeIds);
                    handleInvalidIdsChange("assignee_ids", []);
                  }}
                  buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
                  buttonClassName={cn({
                    "hover:bg-transparent": value?.length > 0,
                    [COMMON_BUTTON_CLASS_NAME]: !value || value?.length === 0,
                    [COMMON_ERROR_CLASS_NAME]: Boolean(
                      assigneeIdsError || (invalidIds?.assignee_ids && invalidIds?.assignee_ids?.length > 0)
                    ),
                  })}
                  placeholder={t("assignees")}
                  multiple
                  disabled={!projectId}
                  {...(usePropsForAdditionalData
                    ? { getUserDetails: props.getUserDetails, memberIds: props.memberIds }
                    : {})}
                />
              </div>
            )}
          />

          {/* Labels */}
          <Controller
            control={control}
            name={fieldPaths.labelIds}
            disabled={!projectId}
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                {usePropsForAdditionalData ? (
                  <WorkItemLabelSelectBase
                    {...commonLabelDropdownProps}
                    getLabelById={props.getLabelById}
                    labelIds={props.labelIds}
                    onChange={(labelIds) => {
                      onChange(labelIds);
                      handleInvalidIdsChange("label_ids", []);
                    }}
                    value={value}
                  />
                ) : (
                  <IssueLabelSelect
                    {...commonLabelDropdownProps}
                    onChange={(labelIds) => {
                      onChange(labelIds);
                      handleInvalidIdsChange("label_ids", []);
                    }}
                    value={value}
                  />
                )}
              </div>
            )}
          />

          {/* Module */}
          {isModuleViewEnabled && (
            <Controller
              control={control}
              name={fieldPaths.moduleIds}
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  {usePropsForAdditionalData ? (
                    <ModuleDropdownBase
                      {...commonModuleDropdownProps}
                      buttonVariant="border-with-text"
                      getModuleById={props.getModuleById}
                      moduleIds={props.moduleIds}
                      multiple
                      onChange={(moduleIds) => {
                        onChange(moduleIds);
                        handleInvalidIdsChange("module_ids", []);
                      }}
                      value={value ?? []}
                    />
                  ) : (
                    <ModuleDropdown
                      {...commonModuleDropdownProps}
                      multiple
                      buttonVariant="border-with-text"
                      onChange={(moduleIds) => {
                        onChange(moduleIds);
                        handleInvalidIdsChange("module_ids", []);
                      }}
                      value={value ?? []}
                    />
                  )}
                </div>
              )}
            />
          )}
        </div>
      </div>
    </>
  );
};
