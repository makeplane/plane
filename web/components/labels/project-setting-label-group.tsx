import React from "react";
import { useRouter } from "next/router";
import { Disclosure, Transition } from "@headlessui/react";

// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { CustomMenu } from "@plane/ui";
// icons
import { ChevronDown, Component, MoreVertical, Pencil, Trash2, X } from "lucide-react";
// types
import { IIssueLabel } from "types";
import { Draggable, Droppable } from "@hello-pangea/dnd";

type Props = {
  label: IIssueLabel;
  labelChildren: IIssueLabel[];
  handleLabelDelete: (label: IIssueLabel) => void;
  editLabel: (label: IIssueLabel) => void;
};

export const ProjectSettingLabelGroup: React.FC<Props> = observer((props) => {
  const { label, labelChildren, editLabel, handleLabelDelete } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { projectLabel: projectLabelStore } = useMobxStore();

  const removeFromGroup = (label: IIssueLabel) => {
    if (!workspaceSlug || !projectId) return;

    projectLabelStore.updateLabel(workspaceSlug.toString(), projectId.toString(), label.id, {
      parent: null,
    });
  };

  return (
    <Disclosure as="div" className="rounded border-[0.5px] bg-custom-background-100 text-custom-text-100" defaultOpen>
      {({ open }) => (
        <>
          <Droppable key={`label.group.droppable.${label.id}`} droppableId={`label.group.droppable.${label.id}`}>
            {(droppableProvided, droppableSnapshot) => (
              <div
                className={`max-h-full overflow-y-auto p-3 ${
                  droppableSnapshot.isDraggingOver
                    ? "border rounded border-custom-primary-100"
                    : "border-custom-border-200"
                }`}
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
              >
                <>
                  <div className="flex cursor-pointer items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Component className="h-4 w-4 text-custom-text-100 flex-shrink-0" />
                      <h6>{label.name}</h6>
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomMenu ellipsis buttonClassName="!text-custom-sidebar-text-400">
                        <CustomMenu.MenuItem onClick={() => editLabel(label)}>
                          <span className="flex items-center justify-start gap-2">
                            <Pencil className="h-4 w-4" />
                            <span>Edit label</span>
                          </span>
                        </CustomMenu.MenuItem>
                        <CustomMenu.MenuItem onClick={handleLabelDelete}>
                          <span className="flex items-center justify-start gap-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Delete label</span>
                          </span>
                        </CustomMenu.MenuItem>
                      </CustomMenu>
                      <Disclosure.Button>
                        <span>
                          <ChevronDown
                            className={`h-4 w-4 text-custom-sidebar-text-400 ${!open ? "rotate-90 transform" : ""}`}
                          />
                        </span>
                      </Disclosure.Button>
                    </div>
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
                      <div className="mt-2.5 ml-6">
                        {labelChildren.map((child, index) => (
                          <div key={child.id} className={`group w-full flex items-center text-sm`}>
                            <Draggable
                              key={`child.label.draggable.${child.id}`}
                              draggableId={`child.label.draggable.${child.id}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  key={child.id}
                                  className={`flex w-full items-center px-4 py-2.5 border-custom-border-200 ${
                                    snapshot.isDragging
                                      ? "border rounded shadow-custom-shadow-xs"
                                      : labelChildren.length - 1 == index
                                      ? ""
                                      : "border-b-[0.5px]"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    className={`rounded text-custom-sidebar-text-200 flex flex-shrink-0 mr-2 group-hover:opacity-100  ${
                                      snapshot.isDragging ? "opacity-100" : "opacity-0"
                                    }`}
                                    {...provided.dragHandleProps}
                                  >
                                    <MoreVertical className="h-3.5 w-3.5 stroke-custom-text-400" />
                                    <MoreVertical className="h-3.5 w-3.5 stroke-custom-text-400 -ml-5" />
                                  </button>
                                  <h5 className="flex items-center gap-3 mr-auto">
                                    <span
                                      className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
                                      style={{
                                        backgroundColor: child.color && child.color !== "" ? child.color : "#000000",
                                      }}
                                    />
                                    {child.name}
                                  </h5>
                                  <div className="flex items-center gap-3.5 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100">
                                    <div className="h-4 w-4">
                                      <CustomMenu
                                        customButton={
                                          <div className="h-4 w-4">
                                            <Component className="h-4 w-4 leading-4 text-custom-sidebar-text-400 flex-shrink-0" />
                                          </div>
                                        }
                                      >
                                        <CustomMenu.MenuItem onClick={() => removeFromGroup(child)}>
                                          <span className="flex items-center justify-start gap-2">
                                            <X className="h-4 w-4" />
                                            <span>Remove from group</span>
                                          </span>
                                        </CustomMenu.MenuItem>
                                        <CustomMenu.MenuItem onClick={() => editLabel(child)}>
                                          <span className="flex items-center justify-start gap-2">
                                            <Pencil className="h-4 w-4" />
                                            <span>Edit label</span>
                                          </span>
                                        </CustomMenu.MenuItem>
                                      </CustomMenu>
                                    </div>

                                    <div className="flex items-center">
                                      <button
                                        className="flex items-center justify-start gap-2"
                                        onClick={() => handleLabelDelete(label)}
                                      >
                                        <X className="h-[18px] w-[18px] text-custom-sidebar-text-400 flex-shrink-0" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
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
