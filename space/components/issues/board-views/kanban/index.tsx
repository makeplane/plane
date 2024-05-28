"use client";

import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { IssueKanBanBlock } from "@/components/issues/board-views/kanban/block";
import { IssueKanBanHeader } from "@/components/issues/board-views/kanban/header";
// ui
import { Icon } from "@/components/ui";
// mobx hook
import { useIssue } from "@/hooks/store";
// interfaces
import { IIssueState, IIssue } from "@/types/issue";

type IssueKanbanViewProps = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueKanbanView: FC<IssueKanbanViewProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { states, getFilteredIssuesByState } = useIssue();

  return (
    <div className="relative flex h-full w-full gap-3 overflow-hidden overflow-x-auto">
      {states &&
        states.length > 0 &&
        states.map((_state: IIssueState) => (
          <div key={_state.id} className="relative flex h-full w-[340px] flex-shrink-0 flex-col">
            <div className="flex-shrink-0">
              <IssueKanBanHeader state={_state} />
            </div>
            <div className="hide-vertical-scrollbar h-full w-full overflow-hidden overflow-y-auto">
              {getFilteredIssuesByState(_state.id) && getFilteredIssuesByState(_state.id).length > 0 ? (
                <div className="space-y-3 px-2 pb-2">
                  {getFilteredIssuesByState(_state.id).map((_issue: IIssue) => (
                    <IssueKanBanBlock
                      key={_issue.id}
                      issue={_issue}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      params={{}}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 pt-10 text-center text-sm font-medium text-custom-text-200">
                  <Icon iconName="stack" />
                  No issues in this state
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
});
