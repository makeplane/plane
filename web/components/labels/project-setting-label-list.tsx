import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import { DragDropContext, Draggable, DropResult, Droppable } from "@hello-pangea/dnd";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  ProjectSettingLabelItem,
  ProjectSettingLabelGroup,
} from "components/labels";
// ui
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "components/common";
// images
import emptyLabel from "public/empty-state/label.svg";
// types
import { IIssueLabel } from "types";
// icons
import { MoreVertical } from "lucide-react";

export const ProjectSettingsLabelList: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const {
    projectLabel: { fetchProjectLabels, projectLabels, updateLabel, projectLabelsTree },
  } = useMobxStore();
  // states
  const [labelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [labelToUpdate, setLabelToUpdate] = useState<IIssueLabel | null>(null);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabel | null>(null);

  // ref
  const scrollToRef = useRef<HTMLFormElement>(null);

  console.log("projectLabelsRenderContents", projectLabelsTree);

  // api call to fetch project details
  useSWR(
    workspaceSlug && projectId ? "PROJECT_LABELS" : null,
    workspaceSlug && projectId ? () => fetchProjectLabels(workspaceSlug.toString(), projectId.toString()) : null
  );

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const editLabel = (label: IIssueLabel) => {
    setLabelForm(true);
    setIsUpdating(true);
    setLabelToUpdate(label);
  };

  const onDragEnd = (result: DropResult) => {
    const childLabel = result.draggableId.split(".")[3];
    const parentLabel = (result.destination || result.combine)?.droppableId?.split(".")[3];

    // single -> single || single -> group || group -> group
    if (childLabel && parentLabel && result.reason == "DROP" && childLabel != parentLabel) {
      updateLabel(workspaceSlug?.toString()!, projectId?.toString()!, childLabel, {
        parent: parentLabel,
      });
      return;
    }

    // Parent -> NULL
    if (result.reason == "DROP" && !result.combine && !result.destination) {
      updateLabel(workspaceSlug?.toString()!, projectId?.toString()!, childLabel, {
        parent: null,
      });
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
      <div className="space-y-3 py-6 overflow-auto w-full">
        {labelForm && (
          <CreateUpdateLabelInline
            labelForm={labelForm}
            setLabelForm={setLabelForm}
            isUpdating={isUpdating}
            labelToUpdate={labelToUpdate}
            ref={scrollToRef}
            onClose={() => {
              setLabelForm(false);
              setIsUpdating(false);
              setLabelToUpdate(null);
            }}
          />
        )}
        {/* labels */}
        <div>
          {projectLabelsTree && (
            <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
              <Droppable droppableId={`labels.root`} isCombineEnabled={true} ignoreContainerClipping={true}>
                {(droppableProvided, droppableSnapshot) => (
                  <div
                    className={`max-h-full mt-3`}
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {projectLabelsTree.map((label, index) => {
                      if (label.children) {
                        return (
                          <Draggable
                            key={`child.label.draggable.${label.id}`}
                            draggableId={`child.label.draggable.${label.name}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div key={label.id} ref={provided.innerRef} {...provided.draggableProps}>
                                <button
                                  type="button"
                                  className={`rounded text-custom-sidebar-text-200 flex flex-shrink-0 mr-1 group-hover:opacity-100 ${
                                    snapshot.isDragging ? "opacity-100" : "opacity-0"
                                  }`}
                                  {...provided.dragHandleProps}
                                >
                                  <MoreVertical className="h-3.5 w-3.5 stroke-custom-text-400" />
                                  <MoreVertical className="h-3.5 w-3.5 stroke-custom-text-400 -ml-5" />
                                </button>
                                <ProjectSettingLabelGroup
                                  key={label.id}
                                  label={label}
                                  labelChildren={label.children || []}
                                  editLabel={(label) => {
                                    editLabel(label);
                                    scrollToRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                    });
                                  }}
                                  handleLabelDelete={() => setSelectDeleteLabel(label)}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      return (
                        <Draggable
                          key={`child.label.draggable.${label.id}`}
                          draggableId={`child.label.draggable.${label.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} className="mt-3">
                              <ProjectSettingLabelItem
                                dragHandleProps={provided.dragHandleProps!}
                                droppableSnapshot={droppableSnapshot}
                                draggableSnapshot={snapshot}
                                key={label.id}
                                label={label}
                                editLabel={(label) => {
                                  editLabel(label);
                                  scrollToRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                  });
                                }}
                                handleLabelDelete={() => setSelectDeleteLabel(label)}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

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
