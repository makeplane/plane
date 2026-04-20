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
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { EditIcon, CloseIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import type { IBaseLabel } from "@plane/types";
import { CustomMenu, DragHandle } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { LabelName } from "@/components/labels/label-block/label-name";
import type { TWorkspaceLabelOperationsCallbacks } from "./create-update-label-inline";
import { CreateUpdateWorkspaceLabelInline } from "./create-update-label-inline";
import { WorkspaceLabelDndHOC } from "./label-dnd-hoc";
import type { LucideIcon } from "lucide-react";

export interface ICustomMenuItem {
  CustomIcon: LucideIcon | React.FC<ISvgIcons>;
  onClick: (label: IBaseLabel) => void;
  isVisible: boolean;
  text: string;
  key: string;
}

type WorkspaceLabelItemBlockProps = {
  label: IBaseLabel;
  isDragging: boolean;
  customMenuItems: ICustomMenuItem[];
  handleLabelDelete: (label: IBaseLabel) => void;
  isLabelGroup?: boolean;
  dragHandleRef: MutableRefObject<HTMLButtonElement | null>;
  permissions: {
    canDragAndDrop: boolean;
    canDelete: boolean;
  };
};

function WorkspaceLabelItemBlock(props: WorkspaceLabelItemBlockProps) {
  const { label, isDragging, customMenuItems, handleLabelDelete, isLabelGroup, dragHandleRef, permissions } = props;
  // states
  const [isMenuActive, setIsMenuActive] = useState(true);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  // derived values
  const isAnyMenuVisible = customMenuItems.some(({ isVisible }) => isVisible);
  const isAnyActionAvailable = isAnyMenuVisible || permissions.canDelete;

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <div className="group flex items-center">
      <div className="flex items-center">
        {permissions.canDragAndDrop && (
          <DragHandle
            className={cn("opacity-0 group-hover:opacity-100", {
              "opacity-100": isDragging,
            })}
            ref={dragHandleRef}
          />
        )}
        <LabelName color={label.color} name={label.name} isGroup={isLabelGroup ?? false} />
      </div>

      {isAnyActionAvailable && (
        <div
          ref={actionSectionRef}
          className={`absolute right-2.5 flex items-center gap-2 ${
            isMenuActive || isLabelGroup
              ? "opacity-100"
              : "opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
          } ${isLabelGroup && "-top-0.5"}`}
        >
          {isAnyMenuVisible && (
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
          )}
          {!isLabelGroup && permissions.canDelete && (
            <div className="py-0.5">
              <button
                className="flex size-5 items-center justify-center rounded-sm hover:bg-layer-1"
                onClick={() => {
                  handleLabelDelete(label);
                }}
              >
                <CloseIcon className="size-3.5 flex-shrink-0 text-tertiary" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type WorkspaceSettingLabelItemProps = {
  label: IBaseLabel;
  handleLabelDelete: (label: IBaseLabel) => void;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isParentDragging?: boolean;
  isChild: boolean;
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

export function WorkspaceSettingLabelItem(props: WorkspaceSettingLabelItemProps) {
  const {
    label,
    setIsUpdating,
    handleLabelDelete,
    isChild,
    isLastChild,
    isParentDragging = false,
    onDrop,
    labelOperationsCallbacks,
    permissions,
    onRemoveFromGroup,
  } = props;
  // states
  const [isEditLabelForm, setEditLabelForm] = useState(false);

  const customMenuItems: ICustomMenuItem[] = [
    {
      CustomIcon: CloseIcon,
      onClick: (label) => onRemoveFromGroup?.(label),
      isVisible: !!label.parent && !!onRemoveFromGroup && permissions.canEdit,
      text: "Remove from group",
      key: "remove_from_group",
    },
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
  ];

  return (
    <WorkspaceLabelDndHOC
      label={label}
      isGroup={false}
      isChild={isChild}
      isLastChild={isLastChild}
      onDrop={onDrop}
      canReorder={permissions.canReorder}
    >
      {(isDragging, isDroppingInLabel, dragHandleRef) => (
        <div
          className={`rounded-sm ${isDroppingInLabel ? "border-[2px] border-accent-strong" : "border-[1.5px] border-transparent"}`}
        >
          <div
            className={cn("py-2.5 px-1.5 group relative flex items-center justify-between gap-2 space-y-3 rounded-md", {
              "border-[0.5px] border-subtle": !isDroppingInLabel,
              "bg-layer-1": isDragging || isParentDragging,
              "bg-surface-1": !(isDragging || isParentDragging),
              "px-3": isEditLabelForm,
            })}
          >
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
              <WorkspaceLabelItemBlock
                label={label}
                isDragging={isDragging}
                customMenuItems={customMenuItems}
                handleLabelDelete={handleLabelDelete}
                dragHandleRef={dragHandleRef}
                permissions={{
                  canDragAndDrop: permissions.canReorder,
                  canDelete: permissions.canDelete,
                }}
              />
            )}
          </div>
        </div>
      )}
    </WorkspaceLabelDndHOC>
  );
}
