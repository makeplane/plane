"use-client";
import React, { FC } from "react";
// plane imports
import type { TDeDupeIssue } from "@plane/types";
// local-imports
import { DeDupeIssueBlockContent } from "../issue-block/block-content";
import { DeDupeIssueBlockWrapper } from "../issue-block/block-wrapper";
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
