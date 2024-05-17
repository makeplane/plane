"use client";
import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { IssueListBlock } from "@/components/issues/board-views/list/block";
import { IssueListHeader } from "@/components/issues/board-views/list/header";
// mobx hook
import { useIssue } from "@/hooks/store";
// types
import { IIssueState, IIssue } from "@/types/issue";

type IssueListViewProps = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueListView: FC<IssueListViewProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { states, getFilteredIssuesByState } = useIssue();

  return (
    <>
      {states &&
        states.length > 0 &&
        states.map((_state: IIssueState) => (
          <div key={_state.id} className="relative w-full">
            <IssueListHeader state={_state} />
            {getFilteredIssuesByState(_state.id) && getFilteredIssuesByState(_state.id).length > 0 ? (
              <div className="divide-y divide-custom-border-200">
                {getFilteredIssuesByState(_state.id).map((_issue: IIssue) => (
                  <IssueListBlock key={_issue.id} issue={_issue} workspaceSlug={workspaceSlug} projectId={projectId} />
                ))}
              </div>
            ) : (
              <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues.</div>
            )}
          </div>
        ))}
    </>
  );
});
