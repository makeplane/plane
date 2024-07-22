"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// mobx hook
import { TGroupedIssues } from "@plane/types";
// hooks
import { useIssue } from "@/hooks/store";
import { Column } from "./column";

type Props = {
  anchor: string;
};

export const IssueKanbanLayoutRoot: FC<Props> = observer((props) => {
  const { anchor } = props;
  // store hooks
  const { groupedIssueIds } = useIssue();

  const groupedIssues = groupedIssueIds as TGroupedIssues | undefined;

  if (!groupedIssues) return <></>;

  const issueGroupIds = Object.keys(groupedIssues);

  return (
    <div className="relative flex h-full w-full gap-3 overflow-hidden overflow-x-auto">
      {issueGroupIds?.map((stateId) => {
        const issueIds = groupedIssues[stateId];
        return <Column key={stateId} anchor={anchor} stateId={stateId} issueIds={issueIds} />;
      })}
    </div>
  );
});
