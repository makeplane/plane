"use-client";
import React, { FC } from "react";
// types
import { TDeDupeIssue } from "@plane/types";
// local-components
import { DeDupeIssueBlockContent, DeDupeIssueBlockWrapper } from "../issue-block";
import { DuplicateIssueReadOnlyHeaderRoot } from "./block-header";

type TDuplicateIssueReadOnlyBlockRootProps = {
  workspaceSlug: string;
  issue: TDeDupeIssue;
};

export const DuplicateIssueReadOnlyBlockRoot: FC<TDuplicateIssueReadOnlyBlockRootProps> = (props) => {
  const { workspaceSlug, issue } = props;
  return (
    <DeDupeIssueBlockWrapper workspaceSlug={workspaceSlug} issue={issue}>
      <DuplicateIssueReadOnlyHeaderRoot issue={issue} />
      <DeDupeIssueBlockContent issue={issue} />
    </DeDupeIssueBlockWrapper>
  );
};
