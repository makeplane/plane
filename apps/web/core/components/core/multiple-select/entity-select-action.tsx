import { observer } from "mobx-react";
// ui
import { Checkbox } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  disabled?: boolean;
  groupId: string;
  id: string;
  selectionHelpers: TSelectionHelper;
};

export const MultipleSelectEntityAction = observer(function MultipleSelectEntityAction(props: Props) {
  const { className, disabled = false, groupId, id, selectionHelpers } = props;
  // derived values
  const isSelected = selectionHelpers.getIsEntitySelected(id);

  if (selectionHelpers.isSelectionDisabled) return null;

  return (
    <Checkbox
      className={cn("!outline-none size-3.5", className)}
      iconClassName="size-3"
      onClick={(e) => {
        e.stopPropagation();
        selectionHelpers.handleEntityClick(e, id, groupId);
      }}
      checked={isSelected}
      data-entity-group-id={groupId}
      data-entity-id={id}
      disabled={disabled}
      readOnly
    />
  );
});
