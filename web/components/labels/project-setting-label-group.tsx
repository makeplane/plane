import React, { Dispatch, SetStateAction, useState } from "react";
import { Disclosure, Transition } from "@headlessui/react";

// store
import { observer } from "mobx-react-lite";
// icons
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
// types
import { IIssueLabel } from "@plane/types";
import {
  Draggable,
  DraggableProvided,
  DraggableProvidedDragHandleProps,
  DraggableStateSnapshot,
  Droppable,
} from "@hello-pangea/dnd";
import { ICustomMenuItem, LabelItemBlock } from "./label-block/label-item-block";
import { CreateUpdateLabelInline } from "./create-update-label-inline";
import { ProjectSettingLabelItem } from "./project-setting-label-item";
import useDraggableInPortal from "hooks/use-draggable-portal";

type Props = {
  label: IIssueLabel;
  labelChildren: IIssueLabel[];
  handleLabelDelete: (label: IIssueLabel) => void;
  dragHandleProps: DraggableProvidedDragHandleProps;
  draggableSnapshot: DraggableStateSnapshot;
  isUpdating: boolean;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isDropDisabled: boolean;
};

export const ProjectSettingLabelGroup: React.FC<Props> = observer((props) => {
  const {
    label,
    labelChildren,
    handleLabelDelete,
    draggableSnapshot: groupDragSnapshot,
    dragHandleProps,
    isUpdating,
    setIsUpdating,
    isDropDisabled,
  } = props;

  const [isEditLabelForm, setEditLabelForm] = useState(false);

  const renderDraggable = useDraggableInPortal();

  const customMenuItems: ICustomMenuItem[] = [
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
    {
      CustomIcon: Trash2,
      onClick: handleLabelDelete,
      isVisible: true,
      text: "Delete label",
      key: "delete_label",
    },
  ];

  return (
    <Disclosure
      as="div"
      className={`rounded border-[0.5px] border-custom-border-200 text-custom-text-100 ${
        groupDragSnapshot.combineTargetFor ? "bg-custom-background-80" : "bg-custom-background-100"
      }`}
      defaultOpen
    >
      {({ open }) => (
        <>
          <Droppable
            key={`label.group.droppable.${label.id}`}
            droppableId={`label.group.droppable.${label.id}`}
            isDropDisabled={groupDragSnapshot.isDragging || isUpdating || isDropDisabled}
          >
            {(droppableProvided) => (
              <div
                className={`py-3 pl-1 pr-3 ${!isUpdating && "max-h-full overflow-y-hidden"}`}
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
              >
                <>
                  <div className="relative flex cursor-pointer items-center justify-between gap-2">
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
                        isDragging={groupDragSnapshot.isDragging}
                        customMenuItems={customMenuItems}
                        dragHandleProps={dragHandleProps}
                        handleLabelDelete={handleLabelDelete}
                        isLabelGroup={true}
                      />
                    )}

                    <Disclosure.Button>
                      <span>
                        <ChevronDown
                          className={`h-4 w-4 text-custom-sidebar-text-400 ${!open ? "rotate-90 transform" : ""}`}
                        />
                      </span>
                    </Disclosure.Button>
                  </div>
                  <Transition
                    show={open}
                    enter="transition duration-100 ease-out"
                    enterFrom="transform opacity-0"
                    enterTo="transform opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform opacity-100"
                    leaveTo="transform opacity-0"
                  >
                    <Disclosure.Panel>
                      <div className="ml-6 mt-2.5">
                        {labelChildren.map((child, index) => (
                          <div key={child.id} className={`group flex w-full items-center text-sm`}>
                            <Draggable
                              draggableId={`label.draggable.${child.id}`}
                              index={index}
                              isDragDisabled={groupDragSnapshot.isDragging || isUpdating}
                            >
                              {renderDraggable((provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <div className="w-full py-1" ref={provided.innerRef} {...provided.draggableProps}>
                                  <ProjectSettingLabelItem
                                    label={child}
                                    handleLabelDelete={() => handleLabelDelete(child)}
                                    draggableSnapshot={snapshot}
                                    dragHandleProps={provided.dragHandleProps!}
                                    setIsUpdating={setIsUpdating}
                                    isChild
                                  />
                                </div>
                              ))}
                            </Draggable>
                          </div>
                        ))}
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                  {droppableProvided.placeholder}
                </>
              </div>
            )}
          </Droppable>
        </>
      )}
    </Disclosure>
  );
});
