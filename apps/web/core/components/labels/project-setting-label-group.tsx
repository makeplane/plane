/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { Transition } from "@headlessui/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// plane imports
import { EditIcon, TrashIcon, ChevronDownIcon } from "@plane/propel/icons";
import type { IIssueLabel } from "@plane/types";
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

const LabelGroupCollapsible = observer(function LabelGroupCollapsible({
  label,
  labelChildren,
  isEditLabelForm,
  setEditLabelForm,
  setIsUpdating,
  isUpdating,
  isDragging,
  customMenuItems,
  handleLabelDelete,
  dragHandleRef,
  onDrop,
  isEditable,
  labelOperationsCallbacks,
  isDroppingInLabel,
}: {
  label: IIssueLabel;
  labelChildren: IIssueLabel[];
  isEditLabelForm: boolean;
  setEditLabelForm: Dispatch<SetStateAction<boolean>>;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isUpdating: boolean;
  isDragging: boolean;
  customMenuItems: ICustomMenuItem[];
  handleLabelDelete: (label: IIssueLabel) => void;
  dragHandleRef: React.RefObject<HTMLButtonElement>;
  onDrop: (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => void;
  isEditable: boolean;
  labelOperationsCallbacks: TLabelOperationsCallbacks;
  isDroppingInLabel: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      className={`rounded-sm  text-primary ${
        !isDroppingInLabel ? "border-[0.5px] border-subtle" : ""
      } ${isDragging ? "bg-layer-1" : "bg-surface-1"}`}
      defaultOpen
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className={`py-3 pl-1 pr-3 ${!isUpdating && "max-h-full overflow-y-hidden"}`}>
        <div className="relative flex cursor-pointer items-center justify-between gap-2">
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

          <CollapsibleTrigger>
            <span>
              <ChevronDownIcon className={`h-4 w-4 text-placeholder ${!isOpen ? "rotate-90 transform" : ""}`} />
            </span>
          </CollapsibleTrigger>
        </div>
        <Transition
          show={isOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform opacity-0"
          enterTo="transform opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform opacity-100"
          leaveTo="transform opacity-0"
        >
          <CollapsibleContent>
            <div className="ml-6">
              {labelChildren.map((child, index) => (
                <div key={child.id} className={`group flex w-full items-center text-13`}>
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
          </CollapsibleContent>
        </Transition>
      </div>
    </Collapsible>
  );
});

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
  const [isEditLabelForm, setEditLabelForm] = useState(false);

  const customMenuItems: ICustomMenuItem[] = [
    {
      CustomIcon: EditIcon,
      onClick: () => {
        setEditLabelForm(true);
        setIsUpdating(true);
      },
      isVisible: true,
      text: "Edit label",
      key: "edit_label",
    },
    {
      CustomIcon: TrashIcon,
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
          className={`rounded-sm ${isDroppingInLabel ? "border-[2px] border-accent-strong" : "border-[1.5px] border-transparent"}`}
        >
          <LabelGroupCollapsible
            label={label}
            labelChildren={labelChildren}
            isEditLabelForm={isEditLabelForm}
            setEditLabelForm={setEditLabelForm}
            setIsUpdating={setIsUpdating}
            isUpdating={isUpdating}
            isDragging={isDragging}
            customMenuItems={customMenuItems}
            handleLabelDelete={handleLabelDelete}
            dragHandleRef={dragHandleRef}
            onDrop={onDrop}
            isEditable={isEditable}
            labelOperationsCallbacks={labelOperationsCallbacks}
            isDroppingInLabel={isDroppingInLabel}
          />
        </div>
      )}
    </LabelDndHOC>
  );
});
