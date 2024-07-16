"use client";
import { FC } from "react";
import { observer } from "mobx-react";
// types
import { TGroupedIssues } from "@plane/types";
// mobx hook
import { useIssue } from "@/hooks/store";
import { Group } from "./group";

type Props = {
  anchor: string;
};

export const IssuesListLayoutRoot: FC<Props> = observer((props) => {
  const { anchor } = props;
  // store hooks
  const { groupedIssueIds } = useIssue();

  const groupedIssues = groupedIssueIds as TGroupedIssues | undefined;

  if (!groupedIssues) return <></>;

  const issueGroupIds = Object.keys(groupedIssues);

  return (
    <>
      {issueGroupIds?.map((stateId) => {
        const issueIds = groupedIssues[stateId];

        return <Group key={stateId} anchor={anchor} stateId={stateId} issueIds={issueIds} />;
      })}
    </>
  );
});
