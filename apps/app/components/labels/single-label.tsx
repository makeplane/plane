import React from "react";

// ui
import { CustomMenu } from "components/ui";
// types
import { IIssueLabels } from "types";
//icons
import { RectangleGroupIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

type Props = {
  label: IIssueLabels;
  addLabelToGroup: (parentLabel: IIssueLabels) => void;
  editLabel: (label: IIssueLabels) => void;
  handleLabelDelete: () => void;
};

export const SingleLabel: React.FC<Props> = ({
  label,
  addLabelToGroup,
  editLabel,
  handleLabelDelete,
}) => (
  <div className="gap-2 space-y-3 divide-y divide-custom-border-200 rounded-[10px]  border border-custom-border-200 bg-custom-background-100 p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color && label.color !== "" ? label.color : "#000",
          }}
        />
        <h6 className="text-sm">{label.name}</h6>
      </div>
      <CustomMenu ellipsis>
        <CustomMenu.MenuItem onClick={() => addLabelToGroup(label)}>
          <span className="flex items-center justify-start gap-2">
            <RectangleGroupIcon className="h-4 w-4" />
            <span>Convert to group</span>
          </span>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem onClick={() => editLabel(label)}>
          <span className="flex items-center justify-start gap-2">
            <PencilIcon className="h-4 w-4" />
            <span>Edit label</span>
          </span>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem onClick={handleLabelDelete}>
          <span className="flex items-center justify-start gap-2">
            <TrashIcon className="h-4 w-4" />
            <span>Delete label</span>
          </span>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  </div>
);
