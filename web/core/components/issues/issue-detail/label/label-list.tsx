import { FC } from "react";
import { observer } from "mobx-react";
// components
import { LabelListItem } from "./label-list-item";
// types
import { TLabelOperations } from "./root";

type TLabelList = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  values: string[];
  labelOperations: TLabelOperations;
  disabled: boolean;
};

export const LabelList: FC<TLabelList> = observer((props) => {
  const { workspaceSlug, projectId, issueId, values, labelOperations, disabled } = props;
  const issueLabels = values || undefined;

  if (!issueId || !issueLabels) return <></>;
  return (
    <>
      {issueLabels.map((labelId) => (
        <LabelListItem
          key={labelId}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          labelId={labelId}
          values={issueLabels}
          labelOperations={labelOperations}
          disabled={disabled}
        />
      ))}
    </>
  );
});
