import React, { Dispatch, SetStateAction, useState } from "react";
import { useParams } from "next/navigation";
import { X, Pencil } from "lucide-react";
// types
import { IIssueLabel } from "@plane/types";
// hooks
import { useLabel } from "@/hooks/store";
// components
import { CreateUpdateLabelInline } from "./create-update-label-inline";
import { ICustomMenuItem, LabelItemBlock } from "./label-block/label-item-block";
import { LabelDndHOC } from "./label-drag-n-drop-HOC";

type Props = {
  label: IIssueLabel;
  handleLabelDelete: (label: IIssueLabel) => void;
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
};

export const ProjectSettingLabelItem: React.FC<Props> = (props) => {
  const { label, setIsUpdating, handleLabelDelete, isChild, isLastChild, isParentDragging = false, onDrop } = props;
  // states
  const [isEditLabelForm, setEditLabelForm] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
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
    <LabelDndHOC label={label} isGroup={false} isChild={isChild} isLastChild={isLastChild} onDrop={onDrop}>
      {(isDragging, isDroppingInLabel, dragHandleRef) => (
        <div
          className={`rounded ${isDroppingInLabel ? "border-[2px] border-custom-primary-100" : "border-[1.5px] border-transparent"}`}
        >
          <div
            className={`py-3 px-1 group relative flex items-center justify-between gap-2 space-y-3 rounded  ${
              isDroppingInLabel ? "" : "border-[0.5px] border-custom-border-200"
            } ${isDragging || isParentDragging ? "bg-custom-background-80" : "bg-custom-background-100"}`}
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
                handleLabelDelete={handleLabelDelete}
                dragHandleRef={dragHandleRef}
              />
            )}
          </div>
        </div>
      )}
    </LabelDndHOC>
  );
};
