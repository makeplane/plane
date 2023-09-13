import React from "react";

// ui
import { CustomMenu } from "components/ui";
// types
import { IIssueLabels } from "types";
//icons
import { RectangleGroupIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Component, X } from "lucide-react";

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
  <div className="gap-2 space-y-3 divide-y divide-custom-border-200 rounded border border-custom-border-200 bg-custom-background-100 px-4 py-2.5">
    <div className="group flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color && label.color !== "" ? label.color : "#000",
          }}
        />
        <h6 className="text-sm">{label.name}</h6>
      </div>
      <div className="flex items-center gap-3.5 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="h-4 w-4">
          <CustomMenu
            customButton={
              <div className="h-4 w-4">
                <Component className="h-4 w-4 leading-4 text-custom-sidebar-text-400 flex-shrink-0" />
              </div>
            }
          >
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
          </CustomMenu>
        </div>

        <div className="flex items-center">
          <button className="flex items-center justify-start gap-2" onClick={handleLabelDelete}>
            <X className="h-[18px] w-[18px] text-custom-sidebar-text-400 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
