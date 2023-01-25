import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-beautiful-dnd
import { Draggable } from "react-beautiful-dnd";
// services
import workspaceService from "services/workspace.service";
// components
import SingleIssue from "components/common/board-view/single-issue";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import BoardHeader from "components/common/board-view/board-header";
// ui
import { CustomMenu } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, Properties } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  properties: Properties;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: NestedKeyOf<IIssue> | null;
  groupTitle: string;
  createdBy: string | null;
  bgColor?: string;
  openCreateIssueModal: (issue?: IIssue, actionType?: "create" | "edit" | "delete") => void;
  openIssuesListModal: () => void;
  removeIssueFromModule: (bridgeId: string) => void;
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPreloadedData: React.Dispatch<
    React.SetStateAction<
      | (Partial<IIssue> & {
          actionType: "createIssue" | "edit" | "delete";
        })
      | null
    >
  >;
  stateId: string | null;
};

const SingleModuleBoard: React.FC<Props> = ({
  properties,
  groupedByIssues,
  selectedGroup,
  groupTitle,
  createdBy,
  bgColor,
  openCreateIssueModal,
  openIssuesListModal,
  removeIssueFromModule,
  partialUpdateIssue,
  handleDeleteIssue,
  setPreloadedData,
  stateId,
}) => {
  // Collapse/Expand
  const [isCollapsed, setIsCollapsed] = useState(true);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  if (selectedGroup === "priority")
    groupTitle === "high"
      ? (bgColor = "#dc2626")
      : groupTitle === "medium"
      ? (bgColor = "#f97316")
      : groupTitle === "low"
      ? (bgColor = "#22c55e")
      : (bgColor = "#ff0000");

  const { data: people } = useSWR<IWorkspaceMember[]>(
    workspaceSlug ? WORKSPACE_MEMBERS : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  return (
    <div className={`h-full flex-shrink-0 rounded ${!isCollapsed ? "" : "w-80 border bg-gray-50"}`}>
      <div className={`${!isCollapsed ? "" : "flex h-full flex-col space-y-3 overflow-y-auto"}`}>
        <BoardHeader
          addIssueToState={() => {
            openCreateIssueModal();
            if (selectedGroup !== null) {
              setPreloadedData({
                state: stateId !== null ? stateId : undefined,
                [selectedGroup]: groupTitle,
                actionType: "createIssue",
              });
            }
          }}
          bgColor={bgColor ?? ""}
          createdBy={createdBy}
          groupTitle={groupTitle}
          groupedByIssues={groupedByIssues}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          selectedGroup={selectedGroup}
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
                  const tempPerson = people?.find((p) => p.member.id === assignee)?.member;

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
                          assignees={assignees}
                          people={people}
                          partialUpdateIssue={partialUpdateIssue}
                          handleDeleteIssue={handleDeleteIssue}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              <CustomMenu
                label={
                  <span className="flex items-center gap-1">
                    <PlusIcon className="h-3 w-3" />
                    Add issue
                  </span>
                }
                className="mt-1"
                optionsPosition="left"
                noBorder
              >
                <CustomMenu.MenuItem
                  onClick={() => {
                    openCreateIssueModal();
                    if (selectedGroup !== null) {
                      setPreloadedData({
                        state: stateId !== null ? stateId : undefined,
                        [selectedGroup]: groupTitle,
                        actionType: "createIssue",
                      });
                    }
                  }}
                >
                  Create new
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => openIssuesListModal()}>
                  Add an existing issue
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>
          )}
        </StrictModeDroppable>
      </div>
    </div>
  );
};

export default SingleModuleBoard;
