import { useState } from "react";
import { useRouter } from "next/router";
import { CalendarCheck2, CalendarClock } from "lucide-react";
// types
import { TBulkIssueProperties } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DateDropdown, MemberDropdown, PriorityDropdown, StateDropdown } from "@/components/dropdowns";
import { IssueLabelSelect } from "@/components/issues/select";
import { CreateLabelModal } from "@/components/labels";
// constants
import { EErrorCodes, ERROR_DETAILS } from "@/constants/errors";
import { EIssuesStoreType } from "@/constants/issue";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useIssues } from "@/hooks/store";
import { TSelectionHelper, TSelectionSnapshot } from "@/hooks/use-multiple-select";

type Props = {
  selectionHelpers: TSelectionHelper;
  snapshot: TSelectionSnapshot;
};

export const IssueBulkOperationsProperties: React.FC<Props> = (props) => {
  const { snapshot } = props;
  // states
  const [createLabelModal, setCreateLabelModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    issues: { bulkUpdateProperties },
  } = useIssues(EIssuesStoreType.PROJECT);

  const handleBulkOperation = (data: Partial<TBulkIssueProperties>) => {
    if (!workspaceSlug || !projectId) return;

    bulkUpdateProperties(workspaceSlug.toString(), projectId.toString(), {
      issue_ids: snapshot.selectedEntityIds,
      properties: data,
    }).catch((error) => {
      const errorInfo = ERROR_DETAILS[error?.error_code as EErrorCodes] ?? undefined;
      setToast({
        type: TOAST_TYPE.ERROR,
        title: errorInfo?.title ?? "Error!",
        message: errorInfo?.message ?? "Something went wrong. Please try again.",
      });
    });
  };

  const isUpdateDisabled = !snapshot.isSelectionActive;

  return (
    <>
      <StateDropdown
        value=""
        onChange={(val) => handleBulkOperation({ state_id: val })}
        projectId={projectId?.toString() ?? ""}
        buttonVariant="border-with-text"
        disabled={isUpdateDisabled}
      />
      <PriorityDropdown
        value={undefined}
        onChange={(val) => handleBulkOperation({ priority: val })}
        buttonVariant="border-with-text"
        buttonClassName="!text-custom-text-300"
        disabled={isUpdateDisabled}
      />
      <MemberDropdown
        value={[]}
        onChange={(val) => handleBulkOperation({ assignee_ids: val })}
        buttonVariant="border-with-text"
        placeholder="Assignees"
        multiple
        disabled={isUpdateDisabled}
      />
      <DateDropdown
        value={null}
        onChange={(val) => handleBulkOperation({ start_date: val ? renderFormattedPayloadDate(val) : null })}
        buttonVariant="border-with-text"
        placeholder="Start date"
        icon={<CalendarClock className="size-3 flex-shrink-0" />}
        disabled={isUpdateDisabled}
      />
      <DateDropdown
        value={null}
        onChange={(val) => handleBulkOperation({ target_date: val ? renderFormattedPayloadDate(val) : null })}
        buttonVariant="border-with-text"
        placeholder="Due date"
        icon={<CalendarCheck2 className="size-3 flex-shrink-0" />}
        disabled={isUpdateDisabled}
      />
      {projectId && (
        <>
          <CreateLabelModal
            isOpen={createLabelModal}
            handleClose={() => setCreateLabelModal(false)}
            projectId={projectId.toString()}
            onSuccess={(response) => handleBulkOperation({ label_ids: [response.id] })}
          />
          <IssueLabelSelect
            value={[]}
            projectId={projectId.toString()}
            onChange={(val) => handleBulkOperation({ label_ids: val })}
            setIsOpen={() => setCreateLabelModal(true)}
          />
        </>
      )}
    </>
  );
};
