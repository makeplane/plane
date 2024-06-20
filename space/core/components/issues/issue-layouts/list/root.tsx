"use client";
import { FC } from "react";
import { observer } from "mobx-react";
// components
import { IssueListLayoutBlock, IssueListLayoutHeader } from "@/components/issues";
// mobx hook
import { useIssue } from "@/hooks/store";

type Props = {
  anchor: string;
};

export const IssuesListLayoutRoot: FC<Props> = observer((props) => {
  const { anchor } = props;
  // store hooks
  const { states, getFilteredIssuesByState } = useIssue();

  return (
    <>
      {states?.map((state) => {
        const issues = getFilteredIssuesByState(state.id);

        return (
          <div key={state.id} className="relative w-full">
            <IssueListLayoutHeader state={state} />
            {issues && issues.length > 0 ? (
              <div className="divide-y divide-custom-border-200">
                {issues.map((issue) => (
                  <IssueListLayoutBlock key={issue.id} anchor={anchor} issue={issue} />
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
