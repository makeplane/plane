import { FC } from "react";
import { X } from "lucide-react";
// types
import { TLabelOperations } from "./root";
import { useIssueDetail, useLabel } from "hooks/store";

type TLabelListItem = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  labelId: string;
  labelOperations: TLabelOperations;
};

export const LabelListItem: FC<TLabelListItem> = (props) => {
  const { workspaceSlug, projectId, issueId, labelId, labelOperations } = props;
  // hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getLabelById } = useLabel();

  const issue = getIssueById(issueId);
  const label = getLabelById(labelId);

  const handleLabel = async () => {
    if (issue) {
      const currentLabels = issue.label_ids.filter((_labelId) => _labelId !== labelId);
      await labelOperations.updateIssue(workspaceSlug, projectId, issueId, { label_ids: currentLabels });
    }
  };

  if (!label) return <></>;
  return (
    <div
      key={labelId}
      className="transition-all relative flex items-center gap-1 cursor-pointer border border-custom-border-100 rounded-full text-xs p-0.5 px-1 group hover:border-red-500/50 hover:bg-red-500/20"
      onClick={handleLabel}
    >
      <div
        className="rounded-full h-2 w-2 flex-shrink-0"
        style={{
          backgroundColor: label.color ?? "#000000",
        }}
      />
      <div className="flex-shrink-0">{label.name}</div>
      <div className="flex-shrink-0">
        <X className="transition-all h-2.5 w-2.5 group-hover:text-red-500" />
      </div>
    </div>
  );
};
