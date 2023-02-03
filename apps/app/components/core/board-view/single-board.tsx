import { Dispatch, SetStateAction, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-beautiful-dnd
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { Draggable, DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
// services
import workspaceService from "services/workspace.service";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
// components
import BoardHeader from "components/core/board-view/board-header";
import SingleIssue from "components/core/board-view/single-issue";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, UserAuth } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
  bgColor?: string;
  groupTitle: string;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: NestedKeyOf<IIssue> | null;
  addIssueToState: () => void;
  handleDeleteIssue?: Dispatch<SetStateAction<string | undefined>> | undefined;
  userAuth: UserAuth;
};

export const CommonSingleBoard: React.FC<Props> = ({
  provided,
  snapshot,
  bgColor,
  groupTitle,
  groupedByIssues,
  selectedGroup,
  addIssueToState,
  handleDeleteIssue,
  userAuth,
}) => {
  // collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(true);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const { data: members } = useSWR<IWorkspaceMember[]>(
    workspaceSlug ? WORKSPACE_MEMBERS : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  const createdBy =
    selectedGroup === "created_by"
      ? members?.find((m) => m.member.id === groupTitle)?.member.first_name ?? "loading..."
      : null;

  if (selectedGroup === "priority")
    groupTitle === "high"
      ? (bgColor = "#dc2626")
      : groupTitle === "medium"
      ? (bgColor = "#f97316")
      : groupTitle === "low"
      ? (bgColor = "#22c55e")
      : (bgColor = "#ff0000");

  return (
    <div
      className={`h-full flex-shrink-0 rounded ${
        snapshot && snapshot.isDragging ? "border-theme shadow-lg" : ""
      } ${!isCollapsed ? "" : "w-80 border bg-gray-50"}`}
      ref={provided?.innerRef}
      {...provided?.draggableProps}
    >
      <div className={`${!isCollapsed ? "" : "flex h-full flex-col space-y-3 overflow-y-auto"}`}>
        <BoardHeader
          addIssueToState={addIssueToState}
          bgColor={bgColor}
          createdBy={createdBy}
          groupTitle={groupTitle}
          groupedByIssues={groupedByIssues}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          selectedGroup={selectedGroup}
          provided={provided}
        />
        <StrictModeDroppable key={groupTitle} droppableId={groupTitle}>
          {(provided, snapshot) => (
            <div
              className={`mt-3 h-full space-y-3 overflow-y-auto px-3 pb-3 ${
                snapshot.isDraggingOver ? "bg-indigo-50 bg-opacity-50" : ""
              } ${!isCollapsed ? "hidden" : "block"}`}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {groupedByIssues[groupTitle].map((childIssue, index: number) => {
                const assignees = [
                  ...(childIssue?.assignees_list ?? []),
                  ...(childIssue?.assignees ?? []),
                ]?.map((assignee) => {
                  const tempPerson = members?.find((p) => p.member.id === assignee)?.member;

                  return tempPerson;
                });

                return (
                  <Draggable key={childIssue.id} draggableId={childIssue.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <SingleIssue
                          issue={childIssue}
                          properties={properties}
                          snapshot={snapshot}
                          people={members}
                          assignees={assignees}
                          handleDeleteIssue={handleDeleteIssue}
                          userAuth={userAuth}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {/* <button
                type="button"
                className="flex items-center rounded p-2 text-xs font-medium outline-none duration-300 hover:bg-gray-100"
                onClick={addIssueToState}
              >
                <PlusIcon className="mr-1 h-3 w-3" />
                Create
              </button> */}
            </div>
          )}
        </StrictModeDroppable>
      </div>
    </div>
  );
};
