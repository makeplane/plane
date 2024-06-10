import { useState } from "react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { CalendarCheck2, CalendarClock } from "lucide-react";
// types
import { TBulkIssueProperties } from "@plane/types";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DateDropdown, MemberDropdown, PriorityDropdown, StateDropdown } from "@/components/dropdowns";
import { IssueLabelSelect } from "@/components/issues/select";
import { CreateLabelModal } from "@/components/labels";
// constants
import { EErrorCodes, ERROR_DETAILS } from "@/constants/errors";
import { EIssuesStoreType } from "@/constants/issue";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useIssues } from "@/hooks/store";
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
};

export const IssueBulkOperationsProperties: React.FC<Props> = (props) => {
  const { snapshot } = props;
  // states
  const [createLabelModal, setCreateLabelModal] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    issues: { bulkUpdateProperties },
  } = useIssues(EIssuesStoreType.PROJECT);
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
    <form onSubmit={handleSubmit(handleBulkOperations)} className="size-full flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Controller
          name="state_id"
          control={control}
          render={({ field: { onChange, value } }) => (
            <StateDropdown
              value={value}
              onChange={onChange}
              projectId={projectId?.toString() ?? ""}
              buttonVariant="border-with-text"
              disabled={isUpdateDisabled}
            />
          )}
        />
        <Controller
          name="priority"
          control={control}
          render={({ field: { onChange, value } }) => (
            <PriorityDropdown
              value={value}
              onChange={onChange}
              buttonVariant="border-with-text"
              buttonClassName="!text-custom-text-300"
              disabled={isUpdateDisabled}
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
              buttonClassName={value?.length > 0 ? "hover:bg-transparent" : ""}
              placeholder="Assignees"
              multiple
              disabled={isUpdateDisabled}
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
              icon={<CalendarClock className="size-3 flex-shrink-0" />}
              disabled={isUpdateDisabled}
              maxDate={maxDate ?? undefined}
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
              icon={<CalendarCheck2 className="size-3 flex-shrink-0" />}
              disabled={isUpdateDisabled}
              minDate={minDate ?? undefined}
            />
          )}
        />
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
                <IssueLabelSelect
                  value={value}
                  projectId={projectId.toString()}
                  onChange={onChange}
                  setIsOpen={() => setCreateLabelModal(true)}
                  buttonClassName="text-custom-text-300"
                />
              </>
            )}
          />
        )}
      </div>
      {isDirty && (
        <Button type="submit" variant="primary" size="sm" className="py-1" loading={isSubmitting}>
          {isSubmitting ? "Updating" : "Update"}
        </Button>
      )}
    </form>
  );
};
