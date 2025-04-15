import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
// types
import { useLabel } from "@/hooks/store";
import { TLabelOperations } from "./root";

type TLabelListItem = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  labelId: string;
  values: string[];
  labelOperations: TLabelOperations;
  disabled: boolean;
};

export const LabelListItem: FC<TLabelListItem> = observer((props) => {
  const { workspaceSlug, projectId, issueId, labelId, values, labelOperations, disabled } = props;
  // hooks
  const { getLabelById } = useLabel();

  const label = getLabelById(labelId);

  const handleLabel = async () => {
    if (values && !disabled) {
      const currentLabels = values.filter((_labelId) => _labelId !== labelId);
      await labelOperations.updateIssue(workspaceSlug, projectId, issueId, { label_ids: currentLabels });
    }
  };

  if (!label) return <></>;
  return (
    <div
      key={labelId}
      className={`transition-all relative flex items-center gap-1 truncate border border-custom-border-100 rounded-full text-xs p-0.5 px-1 group ${
        !disabled ? "cursor-pointer hover:border-red-500/50 hover:bg-red-500/20" : "cursor-not-allowed"
      } `}
      onClick={handleLabel}
    >
      <div
        className="rounded-full h-2 w-2 flex-shrink-0"
        style={{
          backgroundColor: label.color ?? "#000000",
        }}
      />
      <div className="truncate">{label.name}</div>
      {!disabled && (
        <div className="flex-shrink-0">
          <X className="transition-all h-2.5 w-2.5 group-hover:text-red-500" />
        </div>
      )}
    </div>
  );
});
