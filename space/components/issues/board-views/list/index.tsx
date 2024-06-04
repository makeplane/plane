"use client";
import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { IssueListBlock } from "@/components/issues/board-views/list/block";
import { IssueListHeader } from "@/components/issues/board-views/list/header";
// mobx hook
import { useIssue } from "@/hooks/store";

type IssueListViewProps = {
  anchor: string;
};

export const IssueListView: FC<IssueListViewProps> = observer((props) => {
  const { anchor } = props;
  // store hooks
  const { states, getFilteredIssuesByState } = useIssue();

  return (
    <>
      {states?.map((state) => {
        const issues = getFilteredIssuesByState(state.id);

        return (
          <div key={state.id} className="relative w-full">
            <IssueListHeader state={state} />
            {issues && issues.length > 0 ? (
              <div className="divide-y divide-custom-border-200">
                {issues.map((issue) => (
                  <IssueListBlock key={issue.id} anchor={anchor} issue={issue} />
                ))}
              </div>
            ) : (
              <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues.</div>
            )}
          </div>
        );
      })}
    </>
  );
});
