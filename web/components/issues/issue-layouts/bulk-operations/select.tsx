// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { TSelectionHelper } from "@/hooks/use-entity-selection";

type Props = {
  className?: string;
  groupId: string;
  id: string;
  selectionHelpers: TSelectionHelper;
};

export const BulkOperationsSelect: React.FC<Props> = (props) => {
  const { className, groupId, id, selectionHelpers } = props;
  // derived values
  const isSelected = selectionHelpers.isEntitySelected(id);

  return (
    <input
      type="checkbox"
      className={cn(
        "opacity-0 pointer-events-none group-hover/list-block:opacity-100 group-hover/list-block:pointer-events-auto cursor-pointer transition-opacity outline-none",
        {
          "opacity-100 pointer-events-auto": isSelected,
        },
        className
      )}
      onClick={(e) => selectionHelpers.handleEntityClick(e, id, groupId)}
      checked={isSelected}
      data-entity-group-id={groupId}
      data-entity-id={id}
    />
  );
};
