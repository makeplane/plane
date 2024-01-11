import { FC } from "react";
// components
import { IssueLabelSelect } from "./label-select";
// types
import { TLabelOperations } from "../root";

type TIssueLabelSelectRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  labelOperations: TLabelOperations;
  disabled?: boolean;
};

export const IssueLabelSelectRoot: FC<TIssueLabelSelectRoot> = (props) => {
  const { workspaceSlug, projectId, issueId, labelOperations, disabled = false } = props;

  const handleLabel = async (_labelIds: string[]) => {
    await labelOperations.updateIssue(workspaceSlug, projectId, issueId, { label_ids: _labelIds });
  };

  return (
    <IssueLabelSelect
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      onSelect={handleLabel}
      disabled={disabled}
    />
  );
};
