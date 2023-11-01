import React, { useRef, useState } from "react";

//hook
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// ui
import { CustomMenu } from "components/ui";
// types
import { IIssueLabels } from "types";
//icons
import { Component, X, Pencil } from "lucide-react";

type Props = {
  label: IIssueLabels;
  addLabelToGroup: (parentLabel: IIssueLabels) => void;
  editLabel: (label: IIssueLabels) => void;
  handleLabelDelete: () => void;
};

export const ProjectSettingLabelItem: React.FC<Props> = (props) => {
  const { label, addLabelToGroup, editLabel, handleLabelDelete } = props;

  const [isMenuActive, setIsMenuActive] = useState(false);
  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <div className="relative group flex items-center justify-between gap-2 space-y-3 rounded border border-custom-border-200 bg-custom-background-100 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color && label.color !== "" ? label.color : "#000",
          }}
        />
        <h6 className="text-sm">{label.name}</h6>
      </div>

      <div
        ref={actionSectionRef}
        className={`absolute -top-0.5 right-3 flex items-start gap-3.5 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 ${
          isMenuActive ? "opacity-100" : ""
        }`}
      >
        <CustomMenu
          customButton={
            <div className="h-4 w-4" onClick={() => setIsMenuActive(!isMenuActive)}>
              <Component className="h-4 w-4 leading-4 text-custom-sidebar-text-400 flex-shrink-0" />
            </div>
          }
        >
          <CustomMenu.MenuItem onClick={() => addLabelToGroup(label)}>
            <span className="flex items-center justify-start gap-2">
              <Component className="h-4 w-4 leading-4 text-custom-sidebar-text-400 flex-shrink-0" />
              <span>Convert to group</span>
            </span>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => editLabel(label)}>
            <span className="flex items-center justify-start gap-2">
              <Pencil className="h-4 w-4" />
              <span>Edit label</span>
            </span>
          </CustomMenu.MenuItem>
        </CustomMenu>
        <div className="py-0.5">
          <button className="flex h-4 w-4 items-center justify-start gap-2" onClick={handleLabelDelete}>
            <X className="h-4 w-4  text-custom-sidebar-text-400 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
