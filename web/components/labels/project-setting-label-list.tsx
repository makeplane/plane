import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  DropResult,
  Droppable,
} from "@hello-pangea/dnd";
// hooks
import { useLabel } from "hooks/store";
import useDraggableInPortal from "hooks/use-draggable-portal";
// components
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  ProjectSettingLabelGroup,
  ProjectSettingLabelItem,
} from "components/labels";
// ui
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "components/common";
// images
import emptyLabel from "public/empty-state/label.svg";
// types
import { IIssueLabel } from "@plane/types";

const LABELS_ROOT = "labels.root";

export const ProjectSettingsLabelList: React.FC = observer(() => {
  // states
  const [showLabelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabel | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  // refs
  const scrollToRef = useRef<HTMLFormElement>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { projectLabels, updateLabelPosition, projectLabelsTree } = useLabel();
  // portal
  const renderDraggable = useDraggableInPortal();

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const onDragEnd = (result: DropResult) => {
    const { combine, draggableId, destination, source } = result;

    // return if dropped outside the DragDropContext
    if (!combine && !destination) return;

    const childLabel = draggableId.split(".")[2];
    let parentLabel: string | undefined | null = destination?.droppableId?.split(".")[3];
    const index = destination?.index || 0;

    const prevParentLabel: string | undefined | null = source?.droppableId?.split(".")[3];
    const prevIndex = source?.index;

    if (combine && combine.draggableId) parentLabel = combine?.draggableId?.split(".")[2];

    if (destination?.droppableId === LABELS_ROOT) parentLabel = null;

    if (result.reason == "DROP" && childLabel != parentLabel) {
      updateLabelPosition(
        workspaceSlug?.toString()!,
        projectId?.toString()!,
        childLabel,
        parentLabel,
        index,
        prevParentLabel == parentLabel,
        prevIndex
      );
      return;
    }
  };

  return (
    <>
      <DeleteLabelModal
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel ?? null}
        onClose={() => setSelectDeleteLabel(null)}
      />
      <div className="flex items-center justify-between border-b border-custom-border-100 py-3.5">
        <h3 className="text-xl font-medium">Labels</h3>
        <Button variant="primary" onClick={newLabel} size="sm">
          Add label
        </Button>
      </div>
      <div className="w-full py-8">
        {showLabelForm && (
          <div className="w-full rounded border border-custom-border-200 px-3.5 py-2 my-2">
            <CreateUpdateLabelInline
              labelForm={showLabelForm}
              setLabelForm={setLabelForm}
              isUpdating={isUpdating}
              ref={scrollToRef}
              onClose={() => {
                setLabelForm(false);
                setIsUpdating(false);
              }}
            />
          </div>
        )}
        {projectLabels ? (
          projectLabels.length === 0 && !showLabelForm ? (
            <EmptyState
              title="No labels yet"
              description="Create labels to help organize and filter issues in you project"
              image={emptyLabel}
              primaryButton={{
                text: "Add label",
                onClick: () => newLabel(),
              }}
            />
          ) : (
            projectLabelsTree && (
              <DragDropContext
                onDragEnd={onDragEnd}
                autoScrollerOptions={{
                  startFromPercentage: 1,
                  disabled: false,
                  maxScrollAtPercentage: 0,
                  maxPixelScroll: 2,
                }}
              >
                <Droppable
                  droppableId={LABELS_ROOT}
                  isCombineEnabled={!isDraggingGroup}
                  ignoreContainerClipping
                  isDropDisabled={isUpdating}
                >
                  {(droppableProvided, droppableSnapshot) => (
                    <div className="mt-3" ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                      {projectLabelsTree.map((label, index) => {
                        if (label.children && label.children.length) {
                          return (
                            <Draggable
                              key={`label.draggable.${label.id}`}
                              draggableId={`label.draggable.${label.id}.group`}
                              index={index}
                              isDragDisabled={isUpdating}
                            >
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                                const isGroup = droppableSnapshot.draggingFromThisWith?.split(".")[3] === "group";
                                setIsDraggingGroup(isGroup);

                                return (
                                  <div ref={provided.innerRef} {...provided.draggableProps} className="mt-3">
                                    <ProjectSettingLabelGroup
                                      key={label.id}
                                      label={label}
                                      labelChildren={label.children || []}
                                      isDropDisabled={isGroup}
                                      dragHandleProps={provided.dragHandleProps!}
                                      handleLabelDelete={(label: IIssueLabel) => setSelectDeleteLabel(label)}
                                      draggableSnapshot={snapshot}
                                      isUpdating={isUpdating}
                                      setIsUpdating={setIsUpdating}
                                    />
                                  </div>
                                );
                              }}
                            </Draggable>
                          );
                        }
                        return (
                          <Draggable
                            key={`label.draggable.${label.id}`}
                            draggableId={`label.draggable.${label.id}`}
                            index={index}
                            isDragDisabled={isUpdating}
                          >
                            {renderDraggable((provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="mt-3">
                                <ProjectSettingLabelItem
                                  dragHandleProps={provided.dragHandleProps!}
                                  draggableSnapshot={snapshot}
                                  label={label}
                                  setIsUpdating={setIsUpdating}
                                  handleLabelDelete={(label) => setSelectDeleteLabel(label)}
                                  isChild={false}
                                />
                              </div>
                            ))}
                          </Draggable>
                        );
                      })}
                      {droppableProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )
          )
        ) : (
          !showLabelForm && (
            <Loader className="space-y-5">
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
            </Loader>
          )
        )}
      </div>
    </>
  );
});
