import React from "react";
// components
import { MembersSelect } from "components/project";
// types
import { IIssue, IUserLite } from "types";

type Props = {
  issue: IIssue;
  onChange: (members: string[]) => void;
  members: IUserLite[] | undefined;
  disabled: boolean;
};

export const AssigneeColumn: React.FC<Props> = (props) => {
  const { issue, onChange, members, disabled } = props;

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        <MembersSelect
          value={issue.assignees}
          onChange={onChange}
          members={members ?? []}
          buttonClassName="!p-0 !rounded-none !shadow-none !border-0"
          hideDropdownArrow
          disabled={disabled}
          multiple
        />
      </span>
    </div>
  );
};
