import React, { useCallback, useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// react beautiful dnd
import type { DropResult } from "react-beautiful-dnd";
import { DragDropContext } from "react-beautiful-dnd";
// services
import stateServices from "lib/services/state.service";
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
// fetching keys
import { STATE_LIST } from "constants/fetch-keys";
// components
import SingleBoard from "components/project/issues/BoardView/single-board";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
// ui
import { Spinner } from "ui";
// types
import type { IState, IIssue, Properties, NestedKeyOf, IProjectMember } from "types";
import ConfirmIssueDeletion from "../confirm-issue-deletion";

type Props = {
  properties: Properties;
  selectedGroup: NestedKeyOf<IIssue> | null;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  members: IProjectMember[] | undefined;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
};

const BoardView: React.FC<Props> = ({
  properties,
  selectedGroup,
  groupedByIssues,
  members,
  handleDeleteIssue,
  partialUpdateIssue,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isIssueDeletionOpen, setIsIssueDeletionOpen] = useState(false);
  const [issueDeletionData, setIssueDeletionData] = useState<IIssue | undefined>();

  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const { activeWorkspace } = useUser();

  const router = useRouter();

  const { projectId } = router.query;

  const { data: states, mutate: mutateState } = useSWR<IState[]>(
    projectId && activeWorkspace ? STATE_LIST(projectId as string) : null,
    activeWorkspace
      ? () => stateServices.getStates(activeWorkspace.slug, projectId as string)
      : null
  );

  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { source, destination, type } = result;

      if (destination.droppableId === "trashBox") {
        const removedItem = groupedByIssues[source.droppableId][source.index];

        setIssueDeletionData(removedItem);
        setIsIssueDeletionOpen(true);
      } else {
        if (type === "state") {
          const newStates = Array.from(states ?? []);
          const [reorderedState] = newStates.splice(source.index, 1);
          newStates.splice(destination.index, 0, reorderedState);
          const prevSequenceNumber = newStates[destination.index - 1]?.sequence;
          const nextSequenceNumber = newStates[destination.index + 1]?.sequence;

          const sequenceNumber =
            prevSequenceNumber && nextSequenceNumber
              ? (prevSequenceNumber + nextSequenceNumber) / 2
              : nextSequenceNumber
              ? nextSequenceNumber - 15000 / 2
              : prevSequenceNumber
              ? prevSequenceNumber + 15000 / 2
              : 15000;

          newStates[destination.index].sequence = sequenceNumber;

          mutateState(newStates, false);
          if (!activeWorkspace) return;
          stateServices
            .patchState(
              activeWorkspace.slug,
              projectId as string,
              newStates[destination.index].id,
              {
                sequence: sequenceNumber,
              }
            )
            .then((response) => {
              console.log(response);
            })
            .catch((err) => {
              console.error(err);
            });
        } else {
          if (source.droppableId !== destination.droppableId) {
            const sourceGroup = source.droppableId; // source group id
            const destinationGroup = destination.droppableId; // destination group id
            if (!sourceGroup || !destinationGroup) return;

            // removed/dragged item
            const removedItem = groupedByIssues[source.droppableId][source.index];

            if (selectedGroup === "priority") {
              // update the removed item for mutation
              removedItem.priority = destinationGroup;

              // patch request
              issuesServices.patchIssue(
                activeWorkspace!.slug,
                projectId as string,
                removedItem.id,
                {
                  priority: destinationGroup,
                }
              );
            } else if (selectedGroup === "state_detail.name") {
              const destinationState = states?.find((s) => s.name === destinationGroup);
              const destinationStateId = destinationState?.id;

              // update the removed item for mutation
              if (!destinationStateId || !destinationState) return;
              removedItem.state = destinationStateId;
              removedItem.state_detail = destinationState;

              // patch request
              issuesServices.patchIssue(
                activeWorkspace!.slug,
                projectId as string,
                removedItem.id,
                {
                  state: destinationStateId,
                }
              );
            }

            // remove item from the source group
            groupedByIssues[source.droppableId].splice(source.index, 1);
            // add item to the destination group
            groupedByIssues[destination.droppableId].splice(destination.index, 0, removedItem);
          }
        }
      }
    },
    [activeWorkspace, mutateState, groupedByIssues, projectId, selectedGroup, states]
  );

  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => {
      setPreloadedData(undefined);
      clearTimeout(timer);
    }, 500);
  }, [isOpen]);

  return (
    <>
      <ConfirmIssueDeletion
        isOpen={isIssueDeletionOpen}
        handleClose={() => setIsIssueDeletionOpen(false)}
        data={issueDeletionData}
      />
      <CreateUpdateIssuesModal
        isOpen={isIssueOpen && preloadedData?.actionType === "createIssue"}
        setIsOpen={setIsIssueOpen}
        prePopulateData={{
          ...preloadedData,
        }}
        projectId={projectId as string}
      />
      {groupedByIssues ? (
        <div className="h-full w-full">
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="h-full w-full overflow-hidden">
              <StrictModeDroppable droppableId="state" type="state" direction="horizontal">
                {(provided) => (
                  <div
                    className="h-full w-full"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <div className="flex gap-x-4 h-full overflow-x-auto overflow-y-hidden pb-3">
                      {Object.keys(groupedByIssues).map((singleGroup, index) => (
                        <SingleBoard
                          key={singleGroup}
                          selectedGroup={selectedGroup}
                          groupTitle={singleGroup}
                          createdBy={
                            selectedGroup === "created_by"
                              ? members?.find((m) => m.member.id === singleGroup)?.member
                                  .first_name ?? "loading..."
                              : null
                          }
                          groupedByIssues={groupedByIssues}
                          index={index}
                          setIsIssueOpen={setIsIssueOpen}
                          properties={properties}
                          setPreloadedData={setPreloadedData}
                          stateId={
                            selectedGroup === "state_detail.name"
                              ? states?.find((s) => s.name === singleGroup)?.id ?? null
                              : null
                          }
                          bgColor={
                            selectedGroup === "state_detail.name"
                              ? states?.find((s) => s.name === singleGroup)?.color
                              : undefined
                          }
                          handleDeleteIssue={handleDeleteIssue}
                          partialUpdateIssue={partialUpdateIssue}
                        />
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
          </DragDropContext>
        </div>
      ) : (
        <div className="h-full w-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </>
  );
};

export default BoardView;
