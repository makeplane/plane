"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { CalendarCheck2, CalendarClock } from "lucide-react";
// plane imports
import { BULK_OPERATION_ERROR_DETAILS, E_BULK_OPERATION_ERROR_CODES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TBulkIssueProperties } from "@plane/types";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { cn, getDate, renderFormattedPayloadDate } from "@plane/utils";
import {
  CycleDropdown,
  DateDropdown,
  EstimateDropdown,
  MemberDropdown,
  ModuleDropdown,
  PriorityDropdown,
  StateDropdown,
} from "@/components/dropdowns";
import { IssueLabelSelect } from "@/components/issues/select";
import { CreateLabelModal } from "@/components/labels";
// helpers
// hooks
import { useProject, useProjectEstimates } from "@/hooks/store";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import { TSelectionHelper, TSelectionSnapshot } from "@/hooks/use-multiple-select";
import { IssueTypeDropdown, TIssueTypeOptionTooltip } from "@/plane-web/components/issue-types/dropdowns";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

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

export const IssueBulkOperationsProperties: React.FC<Props> = observer((props) => {
  const { snapshot } = props;
  // states
  const [createLabelModal, setCreateLabelModal] = useState(false);
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
  const { isWorkItemTypeEnabledForProject, getIssueTypeIdsWithMandatoryProperties } = useIssueTypes();
  // derived values
  const projectDetails = projectId ? getProjectById(projectId.toString()) : undefined;
  const isCyclesEnabled = !!projectDetails?.cycle_view;
  const isModulesEnabled = !!projectDetails?.module_view;
  const isAdvancedBulkOpsEnabled = useFlag(workspaceSlug?.toString(), "BULK_OPS_PRO");
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId?.toString());
  // Get issue types with mandatory properties
  const issueTypeIdsWithMandatoryProperties = useMemo(() => {
    if (!projectId) return [];
    return getIssueTypeIdsWithMandatoryProperties(projectId?.toString());
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

    await bulkUpdateProperties(workspaceSlug.toString(), projectId.toString(), {
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
      })
      .catch((error) => {
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
    <div className="size-full flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-6">
          <Controller
            name="state_id"
            control={control}
            render={({ field: { onChange, value } }) => (
              <StateDropdown
                value={value}
                onChange={(val) => onChange(value === val ? "" : val)}
                projectId={projectId?.toString() ?? ""}
                buttonVariant="border-with-text"
                disabled={isUpdateDisabled}
                showDefaultState={false}
                placement="top-start"
                alwaysAllowStateChange
              />
            )}
          />
        </div>
        <div className="h-6">
          <Controller
            name="priority"
            control={control}
            render={({ field: { onChange, value } }) => (
              <PriorityDropdown
                value={value}
                onChange={(val) => onChange(value === val ? undefined : val)}
                buttonVariant="border-with-text"
                buttonClassName="!text-custom-text-300"
                disabled={isUpdateDisabled}
                placement="top-start"
              />
            )}
          />
        </div>
        <div className="h-6">
          <Controller
            name="assignee_ids"
            control={control}
            render={({ field: { onChange, value } }) => (
              <MemberDropdown
                value={value}
                onChange={onChange}
                buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
                buttonClassName={value?.length > 0 ? "hover:bg-transparent" : ""}
                projectId={projectId?.toString() ?? ""}
                placeholder="Assignees"
                multiple
                disabled={isUpdateDisabled}
                placement="top-start"
              />
            )}
          />
        </div>
        <div className="h-6">
          <Controller
            name="start_date"
            control={control}
            render={({ field: { onChange, value } }) => (
              <DateDropdown
                value={value}
                onChange={(val) => onChange(val ? renderFormattedPayloadDate(val) : null)}
                buttonVariant="border-with-text"
                placeholder="Start date"
                icon={<CalendarClock className="size-3 flex-shrink-0" />}
                disabled={isUpdateDisabled}
                maxDate={maxDate ?? undefined}
                placement="top-start"
              />
            )}
          />
        </div>
        <div className="h-6">
          <Controller
            name="target_date"
            control={control}
            render={({ field: { onChange, value } }) => (
              <DateDropdown
                value={value}
                onChange={(val) => onChange(val ? renderFormattedPayloadDate(val) : null)}
                buttonVariant="border-with-text"
                placeholder="Due date"
                icon={<CalendarCheck2 className="size-3 flex-shrink-0" />}
                disabled={isUpdateDisabled}
                minDate={minDate ?? undefined}
                placement="top-start"
              />
            )}
          />
        </div>
        {projectId && (
          <Controller
            name="label_ids"
            control={control}
            render={({ field: { onChange, value } }) => (
              <>
                <CreateLabelModal
                  isOpen={createLabelModal}
                  handleClose={() => setCreateLabelModal(false)}
                  projectId={projectId.toString()}
                  onSuccess={(res) => onChange([...value, res.id])}
                />
                <div className="h-6">
                  <IssueLabelSelect
                    value={value}
                    projectId={projectId.toString()}
                    onChange={onChange}
                    setIsOpen={() => setCreateLabelModal(true)}
                    buttonContainerClassName="text-custom-text-300 "
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
                  <>
                    <CycleDropdown
                      value={value as string | null}
                      onChange={onChange}
                      projectId={projectId.toString()}
                      buttonVariant="border-with-text"
                      buttonClassName="text-custom-text-300 py-1 rounded"
                      disabled={isUpdateDisabled}
                      placement="top-start"
                      placeholder="Cycle"
                    />
                  </>
                )}
              />
            )}
            {projectId && currentActiveEstimateId && areEstimateEnabledByProjectId(projectId?.toString()) && (
              <Controller
                name="estimate_point"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <EstimateDropdown
                    value={value as string | null}
                    onChange={onChange}
                    projectId={projectId.toString()}
                    buttonVariant="border-with-text"
                    buttonClassName="text-custom-text-300 py-1"
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
                  <>
                    <ModuleDropdown
                      value={value}
                      onChange={onChange}
                      projectId={projectId.toString()}
                      buttonVariant="border-with-text"
                      buttonClassName="text-custom-text-300 border-none  px-2 py-1"
                      buttonContainerClassName="border-[0.5px] border-custom-border-300 rounded"
                      disabled={isUpdateDisabled}
                      placement="top-start"
                      placeholder="Module"
                      showCount
                      multiple
                    />
                  </>
                )}
              />
            )}
            {projectId && isWorkItemTypeEnabled && (
              <Controller
                control={control}
                name="type_id"
                render={({ field: { value, onChange } }) => (
                  <div className={cn("h-6")}>
                    <IssueTypeDropdown
                      issueTypeId={value}
                      projectId={projectId?.toString()}
                      disabled={isUpdateDisabled}
                      variant="xs"
                      optionTooltip={optionTooltip}
                      handleIssueTypeChange={(issueTypeId) => {
                        // Allow issue type to be null (unset issue type)
                        const newValue = value === issueTypeId ? null : issueTypeId;
                        onChange(newValue);
                      }}
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
          size="sm"
          className="py-1"
          onClick={handleSubmit(handleBulkOperations)}
          loading={isSubmitting}
        >
          {isSubmitting ? "Updating" : "Update"}
        </Button>
      )}
    </div>
  );
});
