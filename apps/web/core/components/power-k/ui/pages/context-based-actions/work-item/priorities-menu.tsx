"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane imports
import { ISSUE_PRIORITIES } from "@plane/constants";
import { PriorityIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";

type Props = {
  handleClose: () => void;
  handleUpdateWorkItem: (data: Partial<TIssue>) => void;
  workItemDetails: TIssue;
};

export const PowerKWorkItemPrioritiesMenu: React.FC<Props> = observer((props) => {
  const { handleClose, handleUpdateWorkItem, workItemDetails } = props;

  return (
    <>
      {ISSUE_PRIORITIES.map((priority) => (
        <Command.Item
          key={priority.key}
          onSelect={() => {
            if (workItemDetails.priority === priority.key) return;
            handleUpdateWorkItem({
              priority: priority.key,
            });
            handleClose();
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center space-x-3">
            <PriorityIcon priority={priority.key} />
            <span className="capitalize">{priority.title}</span>
          </div>
          <div className="flex-shrink-0">
            {priority.key === workItemDetails.priority && <Check className="size-3" />}
          </div>
        </Command.Item>
      ))}
    </>
  );
});
