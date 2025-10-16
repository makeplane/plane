"use-client";

import type { FC } from "react";
// types
import type { TDeDupeIssue } from "@plane/types";

type TDuplicateModalRootProps = {
  workspaceSlug: string;
  issues: TDeDupeIssue[];
  handleDuplicateIssueModal: (value: boolean) => void;
};

export const DuplicateModalRoot: FC<TDuplicateModalRootProps> = (props) => {
  const { workspaceSlug, issues, handleDuplicateIssueModal } = props;
  return <></>;
};
