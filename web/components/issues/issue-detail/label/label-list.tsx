import { FC } from "react";
// components
import { LabelListItem } from "./label-list-item";
// hooks
import { useIssueDetail } from "hooks/store";
// types
import { TLabelOperations } from "./root";

type TLabelList = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  labelOperations: TLabelOperations;
  disabled: boolean;
};

export const LabelList: FC<TLabelList> = (props) => {
  const { workspaceSlug, projectId, issueId, labelOperations, disabled } = props;
  // hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);
  const issueLabels = issue?.label_ids || undefined;

  if (!issue || !issueLabels) return <></>;
  return (
    <>
      {issueLabels.map((labelId) => (
        <LabelListItem
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          labelId={labelId}
          labelOperations={labelOperations}
          disabled={disabled}
        />
      ))}
    </>
  );
};
