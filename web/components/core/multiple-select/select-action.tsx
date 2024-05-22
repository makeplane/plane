// ui
import { Checkbox } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  disabled?: boolean;
  groupId: string;
  id: string;
  selectionHelpers: TSelectionHelper;
};

export const MultipleSelectAction: React.FC<Props> = (props) => {
  const { className, disabled = false, groupId, id, selectionHelpers } = props;
  // derived values
  const isSelected = selectionHelpers.isEntitySelected(id);
  const isActive = selectionHelpers.isEntityActive(id);

  return (
    <Checkbox
      className={cn("!outline-none", className)}
      onClick={(e) => {
        e.stopPropagation();
        selectionHelpers.handleEntityClick(e, id, groupId);
      }}
      checked={isSelected}
      data-entity-group-id={groupId}
      data-entity-id={id}
      data-type="multiple-select-action"
      data-active={isActive}
      disabled={disabled}
    />
  );
};
