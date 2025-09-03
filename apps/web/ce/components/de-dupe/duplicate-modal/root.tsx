"use-client";

// types
import { TDeDupeIssue } from "@plane/types";

type TDuplicateModalRootProps = {
  workspaceSlug: string;
  issues: TDeDupeIssue[];
  handleDuplicateIssueModal: (value: boolean) => void;
};

export const DuplicateModalRoot: React.FC<TDuplicateModalRootProps> = (props) => {
  const { workspaceSlug, issues, handleDuplicateIssueModal } = props;
  return <></>;
};
