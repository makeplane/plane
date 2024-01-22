import React, { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/router";
import { DraggableProvidedDragHandleProps, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { X, Pencil } from "lucide-react";
// hooks
import { useLabel } from "hooks/store";
// types
import { IIssueLabel } from "@plane/types";
// components
import { ICustomMenuItem, LabelItemBlock } from "./label-block/label-item-block";
import { CreateUpdateLabelInline } from "./create-update-label-inline";

type Props = {
  label: IIssueLabel;
  handleLabelDelete: (label: IIssueLabel) => void;
  draggableSnapshot: DraggableStateSnapshot;
  dragHandleProps: DraggableProvidedDragHandleProps;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isChild: boolean;
};

export const ProjectSettingLabelItem: React.FC<Props> = (props) => {
  const { label, setIsUpdating, handleLabelDelete, draggableSnapshot, dragHandleProps, isChild } = props;
  const { combineTargetFor, isDragging } = draggableSnapshot;
  // states
  const [isEditLabelForm, setEditLabelForm] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { updateLabel } = useLabel();

  const removeFromGroup = (label: IIssueLabel) => {
    if (!workspaceSlug || !projectId) return;

    updateLabel(workspaceSlug.toString(), projectId.toString(), label.id, {
      parent: null,
    });
  };

  const customMenuItems: ICustomMenuItem[] = [
    {
      CustomIcon: X,
      onClick: removeFromGroup,
      isVisible: !!label.parent,
      text: "Remove from group",
      key: "remove_from_group",
    },
    {
      CustomIcon: Pencil,
      onClick: () => {
        setEditLabelForm(true);
        setIsUpdating(true);
      },
      isVisible: true,
      text: "Edit label",
      key: "edit_label",
    },
  ];

  return (
    <div
      className={`group relative flex items-center justify-between gap-2 space-y-3 rounded border-[0.5px] border-custom-border-200 ${
        !isChild && combineTargetFor ? "bg-custom-background-80" : ""
      } ${isDragging ? "bg-custom-background-80 shadow-custom-shadow-xs" : ""} bg-custom-background-100 px-1 py-2.5`}
    >
      {isEditLabelForm ? (
        <CreateUpdateLabelInline
          labelForm={isEditLabelForm}
          setLabelForm={setEditLabelForm}
          isUpdating
          labelToUpdate={label}
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
          dragHandleProps={dragHandleProps}
          handleLabelDelete={handleLabelDelete}
        />
      )}
    </div>
  );
};
