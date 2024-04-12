import { FC } from "react";
import { observer } from "mobx-react";
import { TIssue } from "@plane/types";
// components
import { StateDropdown, MemberDropdown, PriorityDropdown, DateDropdown } from "@/components/dropdowns";
import { IssueLabelSelect } from "@/components/issues/select";
// helpers
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";

type TInboxIssueProperties = {
  projectId: string;
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
};

export const InboxIssueProperties: FC<TInboxIssueProperties> = observer((props) => {
  const { projectId, data, handleData } = props;

  const startDate = data?.start_date;
  const targetDate = data?.target_date;

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="relative flex flex-wrap gap-2 items-center">
      {/* state */}
      <div>
        <StateDropdown
          value={data?.state_id || ""}
          onChange={(stateId) => handleData("state_id", stateId)}
          projectId={projectId}
          buttonVariant="border-with-text"
        />
      </div>

      {/* Assignees */}
      <div>
        <MemberDropdown
          projectId={projectId}
          value={data?.assignee_ids || []}
          onChange={(assigneeIds) => handleData("assignee_ids", assigneeIds)}
          buttonVariant={(data?.assignee_ids || [])?.length > 0 ? "transparent-without-text" : "border-with-text"}
          buttonClassName={(data?.assignee_ids || [])?.length > 0 ? "hover:bg-transparent" : ""}
          placeholder="Assignees"
          multiple
        />
      </div>

      {/* priority */}
      <div>
        <PriorityDropdown
          value={data?.priority || "none"}
          onChange={(priority) => handleData("priority", priority)}
          buttonVariant="border-with-text"
        />
      </div>

      {/* due date */}
      <div>
        <DateDropdown
          value={data?.target_date || null}
          onChange={(date) => (date ? handleData("target_date", renderFormattedPayloadDate(date)) : null)}
          buttonVariant="border-with-text"
          minDate={minDate ?? undefined}
          placeholder="Due date"
        />
      </div>

      {/* labels */}
      <div>
        <IssueLabelSelect
          createLabelEnabled={false}
          setIsOpen={() => {}}
          value={data?.label_ids || []}
          onChange={(labelIds) => handleData("label_ids", labelIds)}
          projectId={projectId}
        />
      </div>
    </div>
  );
});
