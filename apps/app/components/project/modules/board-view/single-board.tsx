// react
import React, { useState } from "react";
// swr
import useSWR from "swr";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// components
import SingleIssue from "components/common/board-view/single-issue";
// ui
import { CustomMenu } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, Properties } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
// common
import { addSpaceIfCamelCase } from "constants/common";
import { useRouter } from "next/router";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { Draggable } from "react-beautiful-dnd";

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
      | undefined
    >
  >;
  stateId: string | null;
};

const SingleCycleBoard: React.FC<Props> = ({
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
  const [show, setState] = useState(true);

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
    <div className={`h-full flex-shrink-0 rounded ${!show ? "" : "w-80 border bg-gray-50"}`}>
      <div className={`${!show ? "" : "flex h-full flex-col space-y-3 overflow-y-auto"}`}>
        <div
          className={`flex justify-between p-3 pb-0 ${
            !show ? "flex-col rounded-md border bg-gray-50" : ""
          }`}
        >
          <div
            className={`flex w-full items-center justify-between ${
              !show ? "flex-col gap-2" : "gap-1"
            }`}
          >
            <div
              className={`flex cursor-pointer items-center gap-x-1 rounded-md bg-slate-900 px-2 ${
                !show ? "mb-2 flex-col gap-y-2 py-2" : ""
              }`}
              style={{
                border: `2px solid ${bgColor}`,
                backgroundColor: `${bgColor}20`,
              }}
            >
              <h2
                className={`text-[0.9rem] font-medium capitalize`}
                style={{
                  writingMode: !show ? "vertical-rl" : "horizontal-tb",
                }}
              >
                {groupTitle === null || groupTitle === "null"
                  ? "None"
                  : createdBy
                  ? createdBy
                  : addSpaceIfCamelCase(groupTitle)}
              </h2>
              <span className="ml-0.5 text-sm text-gray-500">
                {groupedByIssues[groupTitle].length}
              </span>
            </div>

            <CustomMenu width="auto" ellipsis>
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
        </div>
        <StrictModeDroppable key={groupTitle} droppableId={groupTitle}>
          {(provided, snapshot) => (
            <div
              className={`mt-3 h-full space-y-3 overflow-y-auto px-3 pb-3 ${
                snapshot.isDraggingOver ? "bg-indigo-50 bg-opacity-50" : ""
              } ${!show ? "hidden" : "block"}`}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {groupedByIssues[groupTitle].map((childIssue, index: number) => {
                const assignees = [
                  ...(childIssue?.assignees_list ?? []),
                  ...(childIssue?.assignees ?? []),
                ]?.map((assignee) => {
                  const tempPerson = people?.find((p) => p.member.id === assignee)?.member;

                  return {
                    avatar: tempPerson?.avatar,
                    first_name: tempPerson?.first_name,
                    email: tempPerson?.email,
                  };
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

export default SingleCycleBoard;
