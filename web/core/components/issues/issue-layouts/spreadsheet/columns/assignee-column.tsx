import React from "react";
import { observer } from "mobx-react";
// types
import { TIssue } from "@plane/types";
// components
import { MemberDropdown } from "@/components/dropdowns";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetAssigneeColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <MemberDropdown
        value={issue?.assignee_ids ?? []}
        onChange={(data) => {
          onChange(
            issue,
            { assignee_ids: data },
            {
              changed_property: "assignees",
              change_details: data,
            }
          );
        }}
        projectId={issue?.project_id ?? undefined}
        disabled={disabled}
        multiple
        placeholder="Assignees"
        buttonVariant={
          issue?.assignee_ids && issue.assignee_ids.length > 1 ? "transparent-without-text" : "transparent-with-text"
        }
        buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10"
        buttonContainerClassName="w-full"
        onClose={onClose}
      />
    </div>
  );
});
