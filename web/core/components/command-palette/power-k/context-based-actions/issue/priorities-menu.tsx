"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane types
import { TIssue } from "@plane/types";
// plane ui
import { PriorityIcon } from "@plane/ui";
// constants
import { ISSUE_PRIORITIES } from "@/constants/issue";

type Props = {
  handleClose: () => void;
  handleUpdateIssue: (data: Partial<TIssue>) => void;
  issue: TIssue;
};

export const PowerKPrioritiesMenu: React.FC<Props> = observer((props) => {
  const { handleClose, handleUpdateIssue, issue } = props;

  return (
    <>
      {ISSUE_PRIORITIES.map((priority) => (
        <Command.Item
          key={priority.key}
          onSelect={() => {
            handleUpdateIssue({
              priority: priority.key,
            });
            handleClose();
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center space-x-3">
            <PriorityIcon priority={priority.key} />
            <span className="capitalize">{priority.title ?? "None"}</span>
          </div>
          <div className="flex-shrink-0">{priority.key === issue.priority && <Check className="size-3" />}</div>
        </Command.Item>
      ))}
    </>
  );
});
