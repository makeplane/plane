import type { FC } from "react";
// types
import type { TDeDupeIssue } from "@plane/types";

type TDuplicateModalRootProps = {
  workspaceSlug: string;
  issues: TDeDupeIssue[];
  handleDuplicateIssueModal: (value: boolean) => void;
};

export function DuplicateModalRoot(props: TDuplicateModalRootProps) {
  const { workspaceSlug, issues, handleDuplicateIssueModal } = props;
  return <></>;
}
