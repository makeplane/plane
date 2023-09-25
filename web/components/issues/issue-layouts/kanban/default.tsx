import React from "react";
// components
import { KanBanHeaderRoot } from "./headers/root";
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
  handleDragDrop?: () => void;
}

export const KanBan: React.FC<IKanBan> = observer(({}) => {
  const { issue: issueStore, project: projectStore, issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  // console.log("issueStore", issueStore?.getIssues);
  // console.log("issueStore", projectStore?.projectStates);
  // console.log("issueStore", projectStore?.projectLabels);
  // console.log("issueStore", projectStore?.projectMembers);
  // console.log("issueFilterStore", issueFilterStore);
  // issueStore?.getIssues && Object.keys(issueStore?.getIssues) && Object.keys(issueStore?.getIssues).length > 0

  return (
    <div className="relative w-full h-full overflow-y-auto">
      {group_by && group_by === "state" && (
        <div className="relative w-full h-full flex">
          {projectStore?.projectStates &&
            projectStore?.projectStates.length > 0 &&
            projectStore?.projectStates.map((state) => (
              <div className="flex-shrink-0 flex flex-col border border-red-500 w-[300px] h-full">
                <div className="flex-shrink-0 w-full">
                  <KanBanHeaderRoot column_id={state?.id} />
                </div>
                <div className="w-full h-full">content</div>
                <div className="flex-shrink-0 w-full">footer</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "state.group" && (
        <div className="relative w-full h-full flex">
          {ISSUE_STATE_GROUPS &&
            ISSUE_STATE_GROUPS.length > 0 &&
            ISSUE_STATE_GROUPS.map((state) => (
              <div className="flex-shrink-0 flex flex-col border border-red-500 w-[300px] h-full">
                <KanBanHeaderRoot column_id={state?.key} />
                <div>content</div>
                <div>footer</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "priority" && (
        <div className="relative w-full h-full flex">
          {ISSUE_PRIORITIES &&
            ISSUE_PRIORITIES.length > 0 &&
            ISSUE_PRIORITIES.map((state) => (
              <div className="flex-shrink-0 flex flex-col border border-red-500 w-[300px] h-full">
                <KanBanHeaderRoot column_id={state?.key} />
                <div>content</div>
                <div>footer</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "labels" && (
        <div className="relative w-full h-full flex">
          {projectStore?.projectLabels &&
            projectStore?.projectLabels.length > 0 &&
            projectStore?.projectLabels.map((state) => (
              <div className="flex-shrink-0 flex flex-col border border-red-500 w-[300px] h-full">
                <KanBanHeaderRoot column_id={state?.id} />
                <div>content</div>
                <div>footer</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "assignees" && (
        <div className="relative w-full h-full flex">
          {projectStore?.projectMembers &&
            projectStore?.projectMembers.length > 0 &&
            projectStore?.projectMembers.map((state) => (
              <div className="flex-shrink-0 flex flex-col border border-red-500 w-[300px] h-full">
                <KanBanHeaderRoot column_id={state?.id} />
                <div>content</div>
                <div>footer</div>
              </div>
            ))}
        </div>
      )}

      {group_by && group_by === "created_by" && (
        <div className="relative w-full h-full flex">
          {projectStore?.projectMembers &&
            projectStore?.projectMembers.length > 0 &&
            projectStore?.projectMembers.map((state) => (
              <div className="flex-shrink-0 flex flex-col border border-red-500 w-[300px] h-full">
                <KanBanHeaderRoot column_id={state?.id} />
                <div>content</div>
                <div>footer</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
});
