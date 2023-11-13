import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

// store
import { observer } from "mobx-react-lite";
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
import { IIssueLabels } from "types";
import { DragDropContext, Draggable, DropResult, Droppable } from "@hello-pangea/dnd";

export const ProjectSettingsLabelList: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { project: projectStore, projectLabel: projectLabelStore } = useMobxStore();
  // states
  const [labelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [labelToUpdate, setLabelToUpdate] = useState<IIssueLabels | null>(null);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabels | null>(null);

  // ref
  const scrollToRef = useRef<HTMLFormElement>(null);

  // api call to fetch project details
  useSWR(
    workspaceSlug && projectId ? "PROJECT_LABELS" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // derived values
  const projectLabels = projectStore.projectLabels;

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };


  const editLabel = (label: IIssueLabels) => {
    setLabelForm(true);
    setIsUpdating(true);
    setLabelToUpdate(label);
  };

  const onDragEnd = (result: DropResult) => {
    const childLabel = result.draggableId.split(".")[3];
    const parentLabel = (result.destination || result.combine)?.droppableId?.split(".")[3];

    // single -> single || single -> group || group -> group
    if (childLabel && parentLabel && result.reason == "DROP" && childLabel != parentLabel) {
      projectLabelStore.updateLabel(workspaceSlug?.toString()!, projectId?.toString()!, childLabel, {
        parent: parentLabel,
      });
      return;
    }

    // Parent -> NULL
    if (result.reason == "DROP" && !result.combine && !result.destination) {
      projectLabelStore.updateLabel(workspaceSlug?.toString()!, projectId?.toString()!, childLabel, {
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
        <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
          {projectLabels &&
            projectLabels.map((label, index) => {
              const children = projectLabels?.filter((l) => l.parent === label.id);
              if (children && children.length === 0 && label.parent) {
                return <div key={index} />;
              }

              if (children && children.length === 0) {
                return (
                  <Droppable
                    key={`child.label.droppable.${label.id}`}
                    droppableId={`child.label.droppable.${label.id}`}
                    isCombineEnabled={true}
                    ignoreContainerClipping={true}
                  >
                    {(droppableProvided, droppableSnapshot) => (
                      <div
                        className={`max-h-full mt-3`}
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                      >
                        <Draggable
                          key={`child.label.draggable.${label.id}`}
                          draggableId={`child.label.draggable.${label.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => {
                            if (children && children.length === 0) {
                              if (!label.parent)
                                return (
                                  <div ref={provided.innerRef} {...provided.draggableProps}>
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
                                );
                            }
                          }}
                        </Draggable>
                        {droppableProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              } else {
                return (
                  <div key={label.id}>
                    <ProjectSettingLabelGroup
                      key={label.id}
                      label={label}
                      labelChildren={children}
                      editLabel={(label) => {
                        editLabel(label);
                        scrollToRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }}
                      handleLabelDelete={() => setSelectDeleteLabel(label)}
                    />
                  </div>
                );
              }
            })}
        </DragDropContext>

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
