import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// types
import type { IIssue } from "types";
import type { Control } from "react-hook-form";
import { UserIcon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
};

import { SearchListbox } from "ui";

const SelectParent: React.FC<Props> = ({ control }) => {
  const { issues: projectIssues } = useUser();

  const getSelectedIssueKey = (issueId: string | undefined) => {
    const identifier = projectIssues?.results?.find((i) => i.id.toString() === issueId?.toString())
      ?.project_detail?.identifier;

    const sequenceId = projectIssues?.results?.find(
      (i) => i.id.toString() === issueId?.toString()
    )?.sequence_id;

    if (issueId) return `${identifier}-${sequenceId}`;
    else return "Parent issue";
  };

  return (
    <Controller
      control={control}
      name="parent"
      render={({ field: { value, onChange } }) => (
        <SearchListbox
          title="Parent issue"
          optionsFontsize="sm"
          options={projectIssues?.results?.map((issue) => {
            return {
              value: issue.id,
              display: issue.name,
              element: (
                <div className="flex items-center space-x-3">
                  <div className="block truncate">
                    <span className="block truncate">{`${getSelectedIssueKey(issue.id)}`}</span>
                    <span className="block truncate text-gray-400">{issue.name}</span>
                  </div>
                </div>
              ),
            };
          })}
          value={value}
          buttonClassName="max-h-30 overflow-y-scroll"
          optionsClassName="max-h-30 overflow-y-scroll"
          onChange={onChange}
          icon={<UserIcon className="h-4 w-4 text-gray-400" />}
        />
      )}
    />
  );
};

export default SelectParent;
