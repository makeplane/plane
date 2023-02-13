import React from "react";

// ui
import { CustomMenu } from "components/ui";
// types
import { IIssueLabels } from "types";

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
  <div className="gap-2 space-y-3 divide-y rounded-md border p-3 md:w-2/3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color,
          }}
        />
        <h6 className="text-sm">{label.name}</h6>
      </div>
      <CustomMenu ellipsis>
        <CustomMenu.MenuItem onClick={() => addLabelToGroup(label)}>
          Convert to group
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem onClick={() => editLabel(label)}>Edit</CustomMenu.MenuItem>
        <CustomMenu.MenuItem onClick={() => handleLabelDelete(label.id)}>
          Delete
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  </div>
);
