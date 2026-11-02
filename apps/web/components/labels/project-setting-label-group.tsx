/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ChevronDownOutline, DeleteOutline, EditOutline } from "@makeplane/propel/icons";
import type { IIssueLabel } from "@plane/types";
import { cn } from "@plane/utils";
// components
import type { TLabelOperationsCallbacks } from "./create-update-label-inline";
import { CreateUpdateLabelInline } from "./create-update-label-inline";
import type { ICustomMenuItem } from "./label-block/label-item-block";
import { LabelItemBlock } from "./label-block/label-item-block";
import { LabelDndHOC } from "./label-drag-n-drop-HOC";
import { ProjectSettingLabelItem } from "./project-setting-label-item";

type Props = {
  label: IIssueLabel;
  labelChildren: IIssueLabel[];
  handleLabelDelete: (label: IIssueLabel) => void;
  isUpdating: boolean;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isLastChild: boolean;
  onDrop: (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => void;
  labelOperationsCallbacks: TLabelOperationsCallbacks;
  isEditable?: boolean;
};

export const ProjectSettingLabelGroup = observer(function ProjectSettingLabelGroup(props: Props) {
  const {
    label,
    labelChildren,
    handleLabelDelete,
    isUpdating,
    setIsUpdating,
    isLastChild,
    onDrop,
    isEditable = false,
    labelOperationsCallbacks,
  } = props;

  // states
  const [isOpen, setIsOpen] = useState(true);
  const [isEditLabelForm, setEditLabelForm] = useState(false);

  const customMenuItems: ICustomMenuItem[] = [
    {
      CustomIcon: EditOutline,
      onClick: () => {
        setEditLabelForm(true);
        setIsUpdating(true);
      },
      isVisible: true,
      text: "Edit label",
      key: "edit_label",
    },
    {
      CustomIcon: DeleteOutline,
      onClick: () => {
        handleLabelDelete(label);
      },
      isVisible: true,
      text: "Delete label",
      key: "delete_label",
    },
  ];

  return (
    <LabelDndHOC label={label} isGroup isChild={false} isLastChild={isLastChild} onDrop={onDrop}>
      {(isDragging, isDroppingInLabel, dragHandleRef) => (
        <div
          className={cn(
            "overflow-hidden rounded-md border bg-surface-1 text-primary",
            isDroppingInLabel ? "border-accent-strong ring-1 ring-accent-strong" : "border-subtle-1",
            isDragging && "bg-layer-1"
          )}
        >
          {/* propel: the ready-made `Collapsible` puts the label inside the trigger button, and this header
              already carries a menu button, so the disclosure is hand-rolled instead. */}
          <div>
            <div className={cn(!isUpdating && "max-h-full overflow-y-hidden")}>
              <div
                className={cn(
                  "relative flex min-h-10 cursor-pointer items-center justify-between gap-2 py-2.5 pr-3",
                  isEditLabelForm && "pl-3"
                )}
              >
                {isEditLabelForm ? (
                  <CreateUpdateLabelInline
                    labelForm={isEditLabelForm}
                    setLabelForm={setEditLabelForm}
                    isUpdating
                    labelToUpdate={label}
                    labelOperationsCallbacks={labelOperationsCallbacks}
                    onClose={() => {
                      setEditLabelForm(false);
                      setIsUpdating(false);
                    }}
                  />
                ) : (
                  <LabelItemBlock
                    label={label}
                    isDragging={isDragging}
                    customMenuItems={customMenuItems}
                    handleLabelDelete={handleLabelDelete}
                    isLabelGroup
                    dragHandleRef={dragHandleRef}
                  />
                )}

                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={label.name}
                  aria-expanded={isOpen}
                  onClick={() => setIsOpen((prev) => !prev)}
                  icon={
                    <Icon
                      icon={
                        <ChevronDownOutline
                          className={cn("size-4 text-placeholder transition-transform", !isOpen && "-rotate-90")}
                        />
                      }
                    />
                  }
                />
              </div>
              {isOpen && (
                <div className="space-y-2 border-t border-subtle bg-layer-2 px-3 py-3">
                  {labelChildren.map((child, index) => (
                    <div key={child.id} className="group flex w-full items-center text-body-xs-regular">
                      <div className="w-full">
                        <ProjectSettingLabelItem
                          label={child}
                          handleLabelDelete={() => handleLabelDelete(child)}
                          setIsUpdating={setIsUpdating}
                          isParentDragging={isDragging}
                          isChild
                          isLastChild={index === labelChildren.length - 1}
                          onDrop={onDrop}
                          isEditable={isEditable}
                          labelOperationsCallbacks={labelOperationsCallbacks}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </LabelDndHOC>
  );
});
