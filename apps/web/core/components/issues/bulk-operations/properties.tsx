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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { Controller, useForm } from "react-hook-form";
// plane imports
import type { E_BULK_OPERATION_ERROR_CODES } from "@plane/constants";
import { BULK_OPERATION_ERROR_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { DueDatePropertyIcon, StartDatePropertyIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TBulkIssueProperties } from "@plane/types";
// components
import { cn, getDate, renderFormattedPayloadDate } from "@plane/utils";
import { CycleDropdown } from "@/components/dropdowns/cycle";
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { IssueLabelSelect } from "@/components/issues/select";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import type { TSelectionHelper, TSelectionSnapshot } from "@/hooks/use-multiple-select";
// plane web imports
import { IssueTypeDropdown } from "@/components/work-item-types/dropdowns/issue-type";
import type { TIssueTypeOptionTooltip } from "@/components/work-item-types/dropdowns/issue-type";
import { useIssueTypes, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import { EWorkspaceFeatures } from "@/types/workspace-feature";

type Props = {
  selectionHelpers: TSelectionHelper;
  snapshot: TSelectionSnapshot;
};

const defaultValues: TBulkIssueProperties = {
  state_id: "",
  // @ts-expect-error priority should not be undefined, but it should be, in this case
  priority: undefined,
  assignee_ids: [],
  start_date: null,
  target_date: null,
  label_ids: [],
  cycle_id: "",
  module_ids: [],
  estimate_point: null,
  type_id: null,
};

export const IssueBulkOperationsProperties = observer(function IssueBulkOperationsProperties(props: Props) {
  const { snapshot } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const {
    issues: { bulkUpdateProperties },
  } = useIssuesStore();
  const { currentActiveEstimateId, areEstimateEnabledByProjectId } = useProjectEstimates();
  const {
    loader: workItemTypeLoader,
    getProjectIssueTypes,
    isWorkItemTypeEnabledForProject,
    getIssueTypeIdsWithMandatoryProperties,
  } = useIssueTypes();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const projectDetails = getProjectById(projectId);
  const isCyclesEnabled = !!projectDetails?.cycle_view;
  const isModulesEnabled = !!projectDetails?.module_view;
  const isAdvancedBulkOpsEnabled = useFlag(workspaceSlug, "BULK_OPS_PRO");
  const isWorkItemTypeEnabled =
    !!workspaceSlug && !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
  const isWorkItemHierarchyEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_WORK_ITEM_HIERARCHY_ENABLED);
  const shouldShowWorkItemTypeSelect = isWorkItemTypeEnabled && !isWorkItemHierarchyEnabled;
  // Get issue types with mandatory properties
  const issueTypeIdsWithMandatoryProperties = useMemo(() => {
    if (!projectId) return [];
    return getIssueTypeIdsWithMandatoryProperties(projectId);
  }, [getIssueTypeIdsWithMandatoryProperties, projectId]);
  // Create a map of information for issue types with mandatory field
  const optionTooltip: TIssueTypeOptionTooltip = useMemo(() => {
    if (issueTypeIdsWithMandatoryProperties.length === 0) return {};
    return issueTypeIdsWithMandatoryProperties.reduce((acc, issueTypeId) => {
      acc[issueTypeId] =
        "This work item type includes mandatory properties that will initially be blank when a work item is converted to this type.";
      return acc;
    }, {} as TIssueTypeOptionTooltip);
  }, [issueTypeIdsWithMandatoryProperties]);

  // form info
  const {
    control,
    formState: { dirtyFields, isDirty, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm<TBulkIssueProperties>({
    defaultValues,
  });

  const handleBulkOperations = async (data: TBulkIssueProperties) => {
    if (!workspaceSlug || !projectId) return;
    if (Object.keys(dirtyFields).length === 0) return;

    const payload: Partial<TBulkIssueProperties> = {};
    Object.keys(dirtyFields).forEach((key) => {
      const payloadKey = key as keyof typeof dirtyFields;
      // @ts-expect-error values might not match
      payload[payloadKey] = data[payloadKey];
    });

    await bulkUpdateProperties(workspaceSlug, projectId, {
      issue_ids: snapshot.selectedEntityIds,
      properties: payload,
    })
      .then(() => {
        const totalProperties = Object.keys(payload).length;
        const totalIssues = snapshot.selectedEntityIds.length;
        const toastAlertMessage = `Successfully updated ${totalProperties} ${totalProperties > 1 ? "properties" : "property"} for ${totalIssues} ${totalIssues > 1 ? "work items" : "work item"}.`;

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "",
          message: toastAlertMessage,
        });
        reset(defaultValues);
        return;
      })
      .catch((error: { error_code?: E_BULK_OPERATION_ERROR_CODES }) => {
        const errorInfo = BULK_OPERATION_ERROR_DETAILS[error?.error_code as E_BULK_OPERATION_ERROR_CODES] ?? undefined;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t(errorInfo?.i18n_title) ?? "Error!",
          message: t(errorInfo?.i18n_message) ?? "Something went wrong. Please try again.",
        });
      });
  };
  const isUpdateDisabled = !snapshot.isSelectionActive;

  const startDate = watch("start_date");
  const targetDate = watch("target_date");

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="size-full flex items-center justify-between gap-3 h-6">
      <div className="flex items-center gap-3 h-full">
        <Controller
          name="state_id"
          control={control}
          render={({ field: { onChange, value } }) => (
            <StateDropdown
              value={value}
              onChange={(val) => onChange(value === val ? "" : val)}
              projectId={projectId}
              buttonVariant="border-with-text"
              disabled={isUpdateDisabled}
              showDefaultState={false}
              buttonClassName="text-tertiary"
              placement="top-start"
              alwaysAllowStateChange
            />
          )}
        />

        <Controller
          name="priority"
          control={control}
          render={({ field: { onChange, value } }) => (
            <PriorityDropdown
              value={value}
              onChange={(val) => onChange(value === val ? undefined : val)}
              buttonVariant="border-with-text"
              disabled={isUpdateDisabled}
              placement="top-start"
            />
          )}
        />

        <Controller
          name="assignee_ids"
          control={control}
          render={({ field: { onChange, value } }) => (
            <MemberDropdown
              value={value}
              onChange={onChange}
              buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
              buttonClassName={cn("text-tertiary", value?.length > 0 ? "hover:bg-transparent" : "")}
              projectId={projectId}
              placeholder="Assignees"
              multiple
              disabled={isUpdateDisabled}
              placement="top-start"
            />
          )}
        />

        <Controller
          name="start_date"
          control={control}
          render={({ field: { onChange, value } }) => (
            <DateDropdown
              value={value}
              onChange={(val) => onChange(val ? renderFormattedPayloadDate(val) : null)}
              buttonVariant="border-with-text"
              placeholder="Start date"
              icon={<StartDatePropertyIcon className="size-3 shrink-0" />}
              disabled={isUpdateDisabled}
              maxDate={maxDate ?? undefined}
              buttonClassName="text-tertiary"
              placement="top-start"
            />
          )}
        />

        <Controller
          name="target_date"
          control={control}
          render={({ field: { onChange, value } }) => (
            <DateDropdown
              value={value}
              onChange={(val) => onChange(val ? renderFormattedPayloadDate(val) : null)}
              buttonVariant="border-with-text"
              placeholder="Due date"
              icon={<DueDatePropertyIcon className="size-3 shrink-0" />}
              disabled={isUpdateDisabled}
              minDate={minDate ?? undefined}
              buttonClassName="text-tertiary"
              placement="top-start"
            />
          )}
        />

        {projectId && (
          <Controller
            name="label_ids"
            control={control}
            render={({ field: { onChange, value } }) => (
              <>
                <div className="h-6">
                  <IssueLabelSelect
                    value={value}
                    projectId={projectId}
                    onChange={onChange}
                    buttonContainerClassName="text-tertiary"
                    buttonClassName="text-caption-md-medium"
                    placement="top-start"
                  />
                </div>
              </>
            )}
          />
        )}
        {isAdvancedBulkOpsEnabled && (
          <>
            {projectId && isCyclesEnabled && (
              <Controller
                name="cycle_id"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CycleDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    buttonVariant="border-with-text"
                    buttonClassName="text-tertiary py-1 rounded"
                    disabled={isUpdateDisabled}
                    placement="top-start"
                    placeholder="Cycle"
                  />
                )}
              />
            )}
            {projectId && currentActiveEstimateId && areEstimateEnabledByProjectId(projectId) && (
              <Controller
                name="estimate_point"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <EstimateDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    buttonVariant="border-with-text"
                    buttonClassName="text-tertiary"
                    disabled={isUpdateDisabled}
                    placement="top-start"
                    placeholder="Estimates"
                  />
                )}
              />
            )}
            {projectId && isModulesEnabled && (
              <Controller
                name="module_ids"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <ModuleDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    buttonVariant="border-with-text"
                    buttonClassName="text-tertiary"
                    disabled={isUpdateDisabled}
                    placement="top-start"
                    placeholder="Module"
                    showCount
                    multiple
                  />
                )}
              />
            )}
            {shouldShowWorkItemTypeSelect && (
              <Controller
                control={control}
                name="type_id"
                render={({ field: { value, onChange } }) => (
                  <div className={cn("h-6")}>
                    <IssueTypeDropdown
                      disabled={isUpdateDisabled}
                      allWorkItemTypes={Object.values(getProjectIssueTypes(projectId, true))}
                      handleChange={(workItemTypeId) => {
                        // Allow issue type to be null (unset issue type)
                        const newValue = value === workItemTypeId ? null : workItemTypeId;
                        onChange(newValue);
                      }}
                      isInitializing={workItemTypeLoader === "init-loader"}
                      selectedWorkItemTypeId={value?.toString() || null}
                      optionTooltip={optionTooltip}
                      variant="xs"
                    />
                  </div>
                )}
              />
            )}
          </>
        )}
      </div>
      {isDirty && (
        <Button
          variant="primary"
          className="text-caption-md-medium"
          onClick={handleSubmit(handleBulkOperations)}
          loading={isSubmitting}
        >
          {isSubmitting ? "Updating" : "Update"}
        </Button>
      )}
    </div>
  );
});
