import { observer } from "mobx-react";
import { CloseIcon, LabelFilledIcon } from "@plane/propel/icons";
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
    <button
      key={labelId}
      type="button"
      className={cn(
        "h-full w-min flex items-center gap-1.5 rounded-sm px-2 py-0.5 bg-layer-transparent-active group text-body-xs-regular text-tertiary",
        {
          "cursor-pointer": !disabled,
        }
      )}
      onClick={handleLabel}
      disabled={disabled}
    >
      <LabelFilledIcon className="size-3" color={label.color ?? "#000000"} />
      <div className="flex-shrink-0 text-body-xs-regular">{label.name}</div>
      {!disabled && (
        <div className="flex-shrink-0">
          <CloseIcon className="transition-all h-2.5 w-2.5 group-hover:text-danger" />
        </div>
      )}
    </button>
  );
});
