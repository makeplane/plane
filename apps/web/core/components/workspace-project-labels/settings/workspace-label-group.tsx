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

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Transition } from "@headlessui/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { EditIcon, TrashIcon, ChevronDownIcon } from "@plane/propel/icons";
import type { IBaseLabel } from "@plane/types";
import { CustomMenu, DragHandle } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { LabelName } from "@/components/labels/label-block/label-name";
import type { TWorkspaceLabelOperationsCallbacks } from "./create-update-label-inline";
import { CreateUpdateWorkspaceLabelInline } from "./create-update-label-inline";
import { WorkspaceLabelDndHOC } from "./label-dnd-hoc";
import { WorkspaceSettingLabelItem } from "./workspace-label-item";
import type { ICustomMenuItem } from "./workspace-label-item";

type WorkspaceLabelGroupCollapsibleProps = {
  label: IBaseLabel;
  labelChildren: IBaseLabel[];
  isEditLabelForm: boolean;
  setEditLabelForm: Dispatch<SetStateAction<boolean>>;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isUpdating: boolean;
  isDragging: boolean;
  customMenuItems: ICustomMenuItem[];
  handleLabelDelete: (label: IBaseLabel) => void;
  dragHandleRef: MutableRefObject<HTMLButtonElement | null>;
  onDrop: (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => void;
  permissions: {
    canReorder: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canCreate: boolean;
  };
  labelOperationsCallbacks: TWorkspaceLabelOperationsCallbacks;
  isDroppingInLabel: boolean;
  onRemoveFromGroup?: (label: IBaseLabel) => void;
};

function WorkspaceLabelGroupItemBlock(props: {
  label: IBaseLabel;
  isDragging: boolean;
  customMenuItems: ICustomMenuItem[];
  dragHandleRef: MutableRefObject<HTMLButtonElement | null>;
  permissions: {
    canReorder: boolean;
  };
}) {
  const { label, isDragging, customMenuItems, dragHandleRef, permissions } = props;
  const [isMenuActive, setIsMenuActive] = useState(true);
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  const isAnyMenuVisible = customMenuItems.some(({ isVisible }) => isVisible);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <div className="group flex items-center">
      <div className="flex items-center">
        {permissions.canReorder && (
          <DragHandle
            className={cn("opacity-0 group-hover:opacity-100", {
              "opacity-100": isDragging,
            })}
            ref={dragHandleRef}
          />
        )}
        <LabelName color={label.color} name={label.name} isGroup />
      </div>

      {isAnyMenuVisible && (
        <div
          ref={actionSectionRef}
          className={`absolute right-2.5 flex items-center gap-2 -top-0.5 ${
            isMenuActive ? "opacity-100" : "opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
          }`}
        >
          <CustomMenu ellipsis menuButtonOnClick={() => setIsMenuActive(!isMenuActive)} useCaptureForOutsideClick>
            {customMenuItems.map(
              ({ isVisible, onClick, CustomIcon, text, key }) =>
                isVisible && (
                  <CustomMenu.MenuItem key={key} onClick={() => onClick(label)}>
                    <span className="flex items-center justify-start gap-2">
                      <CustomIcon className="size-4" />
                      <span>{text}</span>
                    </span>
                  </CustomMenu.MenuItem>
                )
            )}
          </CustomMenu>
        </div>
      )}
    </div>
  );
}

const WorkspaceLabelGroupCollapsible = observer(function WorkspaceLabelGroupCollapsible(
  props: WorkspaceLabelGroupCollapsibleProps
) {
  const {
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
    permissions,
    labelOperationsCallbacks,
    isDroppingInLabel,
    onRemoveFromGroup,
  } = props;

  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      className={`rounded-sm text-primary ${
        !isDroppingInLabel ? "border-[0.5px] border-subtle" : ""
      } ${isDragging ? "bg-layer-1" : "bg-surface-1"}`}
      defaultOpen
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className={`py-3 pl-1 pr-3 ${!isUpdating && "max-h-full overflow-y-hidden"}`}>
        <div className="relative flex cursor-pointer items-center justify-between gap-2">
          {isEditLabelForm ? (
            <CreateUpdateWorkspaceLabelInline
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
            <WorkspaceLabelGroupItemBlock
              label={label}
              isDragging={isDragging}
              customMenuItems={customMenuItems}
              dragHandleRef={dragHandleRef}
              permissions={{
                canReorder: permissions.canReorder,
              }}
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
                    <WorkspaceSettingLabelItem
                      label={child}
                      handleLabelDelete={() => handleLabelDelete(child)}
                      setIsUpdating={setIsUpdating}
                      isParentDragging={isDragging}
                      isChild
                      isLastChild={index === labelChildren.length - 1}
                      onDrop={onDrop}
                      permissions={permissions}
                      labelOperationsCallbacks={labelOperationsCallbacks}
                      onRemoveFromGroup={onRemoveFromGroup}
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

type WorkspaceSettingLabelGroupProps = {
  label: IBaseLabel;
  labelChildren: IBaseLabel[];
  handleLabelDelete: (label: IBaseLabel) => void;
  isUpdating: boolean;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isLastChild: boolean;
  onDrop: (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => void;
  labelOperationsCallbacks: TWorkspaceLabelOperationsCallbacks;
  permissions: {
    canReorder: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canCreate: boolean;
  };
  onRemoveFromGroup?: (label: IBaseLabel) => void;
};

export const WorkspaceSettingLabelGroup = observer(function WorkspaceSettingLabelGroup(
  props: WorkspaceSettingLabelGroupProps
) {
  const {
    label,
    labelChildren,
    handleLabelDelete,
    isUpdating,
    setIsUpdating,
    isLastChild,
    onDrop,
    permissions,
    labelOperationsCallbacks,
    onRemoveFromGroup,
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
      isVisible: permissions.canEdit,
      text: "Edit label",
      key: "edit_label",
    },
    {
      CustomIcon: TrashIcon,
      onClick: () => {
        handleLabelDelete(label);
      },
      isVisible: permissions.canDelete,
      text: "Delete label",
      key: "delete_label",
    },
  ];

  return (
    <WorkspaceLabelDndHOC
      label={label}
      isGroup
      isChild={false}
      isLastChild={isLastChild}
      onDrop={onDrop}
      canReorder={permissions.canReorder}
    >
      {(isDragging, isDroppingInLabel, dragHandleRef) => (
        <div
          className={`rounded-sm ${isDroppingInLabel ? "border-[2px] border-accent-strong" : "border-[1.5px] border-transparent"}`}
        >
          <WorkspaceLabelGroupCollapsible
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
            permissions={permissions}
            labelOperationsCallbacks={labelOperationsCallbacks}
            isDroppingInLabel={isDroppingInLabel}
            onRemoveFromGroup={onRemoveFromGroup}
          />
        </div>
      )}
    </WorkspaceLabelDndHOC>
  );
});
