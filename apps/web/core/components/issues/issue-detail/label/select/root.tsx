// components
import type { TLabelOperations } from "../root";
import { IssueLabelSelect } from "./label-select";
// types

type TIssueLabelSelectRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  values: string[];
  labelOperations: TLabelOperations;
};

export function IssueLabelSelectRoot(props: TIssueLabelSelectRoot) {
  const { workspaceSlug, projectId, issueId, values, labelOperations } = props;

  const handleLabel = async (_labelIds: string[]) => {
    await labelOperations.updateIssue(workspaceSlug, projectId, issueId, { label_ids: _labelIds });
  };

  return (
    <IssueLabelSelect
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      values={values}
      onSelect={handleLabel}
      onAddLabel={labelOperations.createLabel}
    />
  );
}
