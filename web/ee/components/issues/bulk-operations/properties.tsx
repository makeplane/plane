"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { CalendarCheck2, CalendarClock } from "lucide-react";
// types
import { TBulkIssueProperties } from "@plane/types";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  DateDropdown,
  MemberDropdown,
  PriorityDropdown,
  StateDropdown,
  EstimateDropdown,
  CycleDropdown,
  ModuleDropdown,
} from "@/components/dropdowns";
import { IssueLabelSelect } from "@/components/issues/select";
import { CreateLabelModal } from "@/components/labels";
// constants
import { EErrorCodes, ERROR_DETAILS } from "@/constants/errors";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useProjectEstimates } from "@/hooks/store";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import { TSelectionHelper, TSelectionSnapshot } from "@/hooks/use-multiple-select";

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
};

export const IssueBulkOperationsProperties: React.FC<Props> = observer((props) => {
  const { snapshot } = props;
  // states
  const [createLabelModal, setCreateLabelModal] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    issues: { bulkUpdateProperties },
  } = useIssuesStore();
  const { currentActiveEstimateId } = useProjectEstimates();
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
        const toastAlertMessage = `Successfully updated ${totalProperties} ${totalProperties > 1 ? "properties" : "property"} for ${totalIssues} ${totalIssues > 1 ? "issues" : "issue"}.`;

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "",
          message: toastAlertMessage,
        });
        reset(defaultValues);
      })
      .catch((error) => {
        const errorInfo = ERROR_DETAILS[error?.error_code as EErrorCodes] ?? undefined;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: errorInfo?.title ?? "Error!",
          message: errorInfo?.message ?? "Something went wrong. Please try again.",
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
                    buttonClassName="text-custom-text-300 "
                    placement="top-start"
                  />
                </div>
              </>
            )}
          />
        )}
        {projectId && (
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
        {projectId && currentActiveEstimateId && (
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
        {projectId && (
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
