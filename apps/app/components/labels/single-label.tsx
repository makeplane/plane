import React from "react";

// ui
import { CustomMenu } from "components/ui";
// types
import { IIssueLabels } from "types";
//icons
import { RectangleGroupIcon, LinkIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

type Props = {
  label: IIssueLabels;
  addLabelToGroup: (parentLabel: IIssueLabels) => void;
  editLabel: (label: IIssueLabels) => void;
  handleLabelDelete: (labelId: string) => void;
};

export const SingleLabel: React.FC<Props> = ({
  label,
  addLabelToGroup,
  editLabel,
  handleLabelDelete,
}) => (
  <div className="gap-2 space-y-3 divide-y divide-skin-base rounded-[10px]  border border-skin-base bg-skin-surface-2 p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color && label.color !== "" ? label.color : "#000",
          }}
        />
        <h6 className="font-medium text-skin-muted-2">{label.name}</h6>
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
        <CustomMenu.MenuItem onClick={() => handleLabelDelete(label.id)}>
          <span className="flex items-center justify-start gap-2">
            <TrashIcon className="h-4 w-4" />
            <span>Delete label</span>
          </span>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  </div>
);
