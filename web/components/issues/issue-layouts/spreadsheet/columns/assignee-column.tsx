import React from "react";
import { observer } from "mobx-react-lite";
// components
import { ProjectMemberDropdown } from "components/dropdowns";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  disabled: boolean;
};

export const SpreadsheetAssigneeColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <ProjectMemberDropdown
        value={issue?.assignee_ids ?? []}
        onChange={(data) => onChange(issue, { assignee_ids: data })}
        projectId={issue?.project_id}
        disabled={disabled}
        multiple
        placeholder="Assignees"
        buttonVariant={
          issue?.assignee_ids && issue.assignee_ids.length > 0 ? "transparent-without-text" : "transparent-with-text"
        }
        buttonClassName="text-left"
        buttonContainerClassName="w-full"
      />
    </div>
  );
});
