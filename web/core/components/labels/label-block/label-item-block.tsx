"use client";

import { MutableRefObject, useRef, useState } from "react";
import { LucideIcon, X } from "lucide-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// types
import { IIssueLabel } from "@plane/types";
// ui
import { CustomMenu, DragHandle } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// components
import { LabelName } from "./label-name";

export interface ICustomMenuItem {
  CustomIcon: LucideIcon;
  onClick: (label: IIssueLabel) => void;
  isVisible: boolean;
  text: string;
  key: string;
}

interface ILabelItemBlock {
  label: IIssueLabel;
  isDragging: boolean;
  customMenuItems: ICustomMenuItem[];
  handleLabelDelete: (label: IIssueLabel) => void;
  isLabelGroup?: boolean;
  dragHandleRef: MutableRefObject<HTMLButtonElement | null>;
  disabled?: boolean;
}

export const LabelItemBlock = (props: ILabelItemBlock) => {
  const {
    label,
    isDragging,
    customMenuItems,
    handleLabelDelete,
    isLabelGroup,
    dragHandleRef,
    disabled = false,
  } = props;
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <div className="group flex items-center">
      <div className="flex items-center">
        {!disabled && (
          <DragHandle
            className={cn("opacity-0 group-hover:opacity-100", {
              "opacity-100": isDragging,
            })}
            ref={dragHandleRef}
          />
        )}
        <LabelName color={label.color} name={label.name} isGroup={isLabelGroup ?? false} />
      </div>

      {!disabled && (
        <div
          ref={actionSectionRef}
          className={`absolute right-2.5 flex items-start gap-3.5 px-4 ${
            isMenuActive || isLabelGroup
              ? "opacity-100"
              : "opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
          } ${isLabelGroup && "-top-0.5"}`}
        >
          <CustomMenu ellipsis menuButtonOnClick={() => setIsMenuActive(!isMenuActive)} useCaptureForOutsideClick>
            {customMenuItems.map(
              ({ isVisible, onClick, CustomIcon, text, key }) =>
                isVisible && (
                  <CustomMenu.MenuItem key={key} onClick={() => onClick(label)}>
                    <span className="flex items-center justify-start gap-2">
                      <CustomIcon className="h-4 w-4" />
                      <span>{text}</span>
                    </span>
                  </CustomMenu.MenuItem>
                )
            )}
          </CustomMenu>
          {!isLabelGroup && (
            <div className="py-0.5">
              <button
                className="flex h-4 w-4 items-center justify-start gap-2"
                onClick={() => handleLabelDelete(label)}
              >
                <X className="h-4 w-4  flex-shrink-0 text-custom-sidebar-text-400" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
