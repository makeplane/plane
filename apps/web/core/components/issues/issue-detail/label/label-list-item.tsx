import { observer } from "mobx-react";
import { CloseIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// types
import { useLabel } from "@/hooks/store/use-label";
import type { TLabelOperations } from "./root";

type TLabelListItem = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  labelId: string;
  values: string[];
  labelOperations: TLabelOperations;
  disabled: boolean;
};

export const LabelListItem = observer(function LabelListItem(props: TLabelListItem) {
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
      className={cn(
        "transition-all relative flex items-center gap-1 truncate border border-subtle rounded-full text-caption-sm-regular p-0.5 px-1 group",
        {
          "cursor-pointer hover:border-danger-strong hover:bg-danger-subtle": !disabled,
          "cursor-not-allowed": disabled,
        }
      )}
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
          <CloseIcon className="transition-all h-2.5 w-2.5 group-hover:text-danger" />
        </div>
      )}
    </div>
  );
});
