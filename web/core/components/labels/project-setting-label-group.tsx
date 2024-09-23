import React, { Dispatch, SetStateAction, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// store
// icons
// types
import { IIssueLabel } from "@plane/types";
// components
import { CreateUpdateLabelInline } from "./create-update-label-inline";
import { ICustomMenuItem, LabelItemBlock } from "./label-block/label-item-block";
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
  isEditable?: boolean;
};

export const ProjectSettingLabelGroup: React.FC<Props> = observer((props) => {
  const {
    label,
    labelChildren,
    handleLabelDelete,
    isUpdating,
    setIsUpdating,
    isLastChild,
    onDrop,
    isEditable = false,
  } = props;

  // states
  const [isEditLabelForm, setEditLabelForm] = useState(false);

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
    <LabelDndHOC label={label} isGroup isChild={false} isLastChild={isLastChild} onDrop={onDrop}>
      {(isDragging, isDroppingInLabel, dragHandleRef) => (
        <div
          className={`rounded ${isDroppingInLabel ? "border-[2px] border-custom-primary-100" : "border-[1.5px] border-transparent"}`}
        >
          <Disclosure
            as="div"
            className={`rounded  text-custom-text-100 ${
              !isDroppingInLabel ? "border-[0.5px] border-custom-border-200" : ""
            } ${isDragging ? "bg-custom-background-80" : "bg-custom-background-100"}`}
            defaultOpen
          >
            {({ open }) => (
              <>
                <div className={`py-3 pl-1 pr-3 ${!isUpdating && "max-h-full overflow-y-hidden"}`}>
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
                          isDragging={isDragging}
                          customMenuItems={customMenuItems}
                          handleLabelDelete={handleLabelDelete}
                          isLabelGroup
                          dragHandleRef={dragHandleRef}
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
                        <div className="ml-6">
                          {labelChildren.map((child, index) => (
                            <div key={child.id} className={`group flex w-full items-center text-sm`}>
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
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Disclosure.Panel>
                    </Transition>
                  </>
                </div>
              </>
            )}
          </Disclosure>
        </div>
      )}
    </LabelDndHOC>
  );
});
