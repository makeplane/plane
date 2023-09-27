import React from "react";
// react beautiful dnd
import { Droppable } from "@hello-pangea/dnd";
// components
import { KanBanGroupByHeaderRoot } from "./headers/group-by-root";
import { IssueBlock } from "./block";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";
// mobx
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IKanBan {
  issues?: any;
  handleIssues?: () => void;
  handleDragDrop?: (result: any) => void | undefined;
  sub_group_id?: string;
}

export const KanBan: React.FC<IKanBan> = observer(({ issues, sub_group_id = "null" }) => {
  const { project: projectStore, issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;
  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  return (
    <div className="relative w-full h-full">
      {group_by && group_by === "state" && (
        <div className="relative w-full h-full flex">
          {projectStore?.projectStates &&
            projectStore?.projectStates.length > 0 &&
            projectStore?.projectStates.map((state) => (
              <div className="flex-shrink-0 flex flex-col w-[340px]">
                {sub_group_by === null && (
                  <div className="flex-shrink-0 w-full bg-custom-background-90 py-1 sticky top-0 z-[2]">
                    <KanBanGroupByHeaderRoot column_id={state?.id} />
                  </div>
                )}

                <div className="w-full h-full">
                  <Droppable droppableId={`${sub_group_id}-${state?.id}`}>
                    {(provided: any, snapshot: any) => (
                      <div
                        className={`w-full h-full relative transition-all ${
                          snapshot.isDraggingOver ? `bg-custom-background-80` : ``
                        }`}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {issues && (
                          <IssueBlock sub_group_id={sub_group_id} columnId={state?.id} issues={issues[state?.id]} />
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "state_detail.group" && (
        <div className="relative w-full h-full flex">
          {ISSUE_STATE_GROUPS &&
            ISSUE_STATE_GROUPS.length > 0 &&
            ISSUE_STATE_GROUPS.map((stateGroup) => (
              <div className="flex-shrink-0 flex flex-col w-[300px] h-full">
                {sub_group_by === null && (
                  <div className="flex-shrink-0 w-full">
                    <KanBanGroupByHeaderRoot column_id={stateGroup?.key} />
                  </div>
                )}
                <div className="w-full h-full">content</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "priority" && (
        <div className="relative w-full h-full flex">
          {ISSUE_PRIORITIES &&
            ISSUE_PRIORITIES.length > 0 &&
            ISSUE_PRIORITIES.map((priority) => (
              <div className="flex-shrink-0 flex flex-col w-[300px] h-full">
                {sub_group_by === null && (
                  <div className="flex-shrink-0 w-full">
                    <KanBanGroupByHeaderRoot column_id={priority?.key} />
                  </div>
                )}
                <div className="w-full h-full">content</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "labels" && (
        <div className="relative w-full h-full flex">
          {projectStore?.projectLabels &&
            projectStore?.projectLabels.length > 0 &&
            projectStore?.projectLabels.map((label) => (
              <div className="flex-shrink-0 flex flex-col w-[300px] h-full">
                {sub_group_by === null && (
                  <div className="flex-shrink-0 w-full">
                    <KanBanGroupByHeaderRoot column_id={label?.id} />
                  </div>
                )}
                <div className="w-full h-full">content</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "assignees" && (
        <div className="relative w-full h-full flex">
          {projectStore?.projectMembers &&
            projectStore?.projectMembers.length > 0 &&
            projectStore?.projectMembers.map((member) => (
              <div className="flex-shrink-0 flex flex-col w-[300px] h-full">
                {sub_group_by === null && (
                  <div className="flex-shrink-0 w-full">
                    <KanBanGroupByHeaderRoot column_id={member?.id} />
                  </div>
                )}
                <div className="w-full h-full">content</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "created_by" && (
        <div className="relative w-full h-full flex">
          {projectStore?.projectMembers &&
            projectStore?.projectMembers.length > 0 &&
            projectStore?.projectMembers.map((member) => (
              <div className="flex-shrink-0 flex flex-col w-[300px] h-full">
                {sub_group_by === null && (
                  <div className="flex-shrink-0 w-full">
                    <KanBanGroupByHeaderRoot column_id={member?.id} />
                  </div>
                )}
                <div className="w-full h-full">content</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
});
