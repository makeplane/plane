import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  DropResult,
  Droppable,
} from "@hello-pangea/dnd";

// store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateUpdateLabelInline, DeleteLabelModal, ProjectSettingLabelGroup } from "components/labels";
// ui
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "components/common";
// images
import emptyLabel from "public/empty-state/label.svg";
// types
import { IIssueLabel } from "types";
//component
import { ProjectSettingLabelItem } from "./project-setting-label-item";
import useDraggableInPortal from "hooks/use-draggable-portal";

const LABELS_ROOT = "labels.root";

export const ProjectSettingsLabelList: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const renderDraggable = useDraggableInPortal();

  // store
  const {
    projectLabel: { fetchProjectLabels, projectLabels, updateLabelPosition, projectLabelsTree },
  } = useMobxStore();
  // states
  const [showLabelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabel | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  // ref
  const scrollToRef = useRef<HTMLFormElement>(null);

  // api call to fetch project details
  useSWR(
    workspaceSlug && projectId ? "PROJECT_LABELS" : null,
    workspaceSlug && projectId ? () => fetchProjectLabels(workspaceSlug.toString(), projectId.toString()) : null
  );

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const onDragEnd = (result: DropResult) => {
    const childLabel = result.draggableId.split(".")[3];
    let parentLabel: string | undefined | null = result.destination?.droppableId?.split(".")[3];
    const index = result.destination?.index || 0;

    const prevParentLabel: string | undefined | null = result.source?.droppableId?.split(".")[3];
    const prevIndex = result.source?.index;

    if (result.combine && result.combine.draggableId) {
      parentLabel = result.combine?.draggableId?.split(".")[3];
    }

    if (result.destination?.droppableId === LABELS_ROOT) {
      parentLabel = null;
    }

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

      <div className="flex items-center py-3.5 border-b border-custom-border-100 justify-between">
        <h3 className="text-xl font-medium">Labels</h3>
        <Button variant="primary" onClick={newLabel} size="sm">
          Add label
        </Button>
      </div>
      <div className="w-full">
        {showLabelForm && (
          <div className="w-full rounded border border-custom-border-200 px-3.5 py-2">
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
        {/* labels */}
        <>
          {projectLabelsTree && (
            <DragDropContext
              onDragEnd={(result) => onDragEnd(result)}
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
                ignoreContainerClipping={true}
                isDropDisabled={isUpdating}
              >
                {(droppableProvided, droppableSnapshot) => (
                  <div className={`mt-3`} ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                    {projectLabelsTree.map((label, index) => {
                      if (label.children && label.children.length) {
                        return (
                          <Draggable
                            key={`child.label.draggable.${label.id}`}
                            draggableId={`child.label.draggable.${label.id}.group`}
                            index={index}
                            isDragDisabled={isUpdating}
                          >
                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                              const isGroup = droppableSnapshot.draggingFromThisWith?.split(".")[4] === "group";
                              setIsDraggingGroup(isGroup);
                              return (
                                <div
                                  key={label.id}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="mt-3"
                                >
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
                          key={`child.label.draggable.${label.id}`}
                          draggableId={`child.label.draggable.${label.id}`}
                          index={index}
                          isDragDisabled={isUpdating}
                        >
                          {renderDraggable((provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} className="mt-3">
                              <ProjectSettingLabelItem
                                dragHandleProps={provided.dragHandleProps!}
                                droppableSnapshot={droppableSnapshot}
                                draggableSnapshot={snapshot}
                                key={label.id}
                                label={label}
                                setIsUpdating={setIsUpdating}
                                handleLabelDelete={(label: IIssueLabel) => setSelectDeleteLabel(label)}
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
          )}
        </>

        {/* loading state */}
        {!projectLabels && (
          <Loader className="space-y-5">
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
          </Loader>
        )}

        {/* empty state */}
        {projectLabels && projectLabels.length === 0 && (
          <EmptyState
            title="No labels yet"
            description="Create labels to help organize and filter issues in you project"
            image={emptyLabel}
            primaryButton={{
              text: "Add label",
              onClick: () => newLabel(),
            }}
          />
        )}
      </div>
    </>
  );
});
