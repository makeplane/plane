import { observer } from "mobx-react";
// ui
import { Checkbox } from "@plane/ui";
// components
import { BulkOperationsActionsRoot, IssueBulkOperationsProperties } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMultipleSelectStore } from "@/hooks/store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot: React.FC<Props> = observer((props) => {
  const { className, selectionHelpers } = props;
  // store hooks
  const { isSelectionActive, selectedEntityIds } = useMultipleSelectStore();
  // derived values
  const { handleClearSelection } = selectionHelpers;

  if (!isSelectionActive) return null;

  return (
    <div className={cn("sticky bottom-0 left-0 z-[2] h-14", className)}>
      <div className="size-full bg-custom-background-100 border-t border-custom-border-200 py-4 px-3.5 flex items-center divide-x-[0.5px] divide-custom-border-200 text-custom-text-300">
        <div className="h-7 pr-3 text-sm flex items-center gap-2 flex-shrink-0">
          <Checkbox
            className="!outline-none size-3.5"
            iconClassName="size-3"
            onClick={handleClearSelection}
            indeterminate
          />
          <div className="flex items-center gap-1">
            <span
              className="flex-shrink-0"
              style={{ minWidth: `${Math.max(8, String(selectedEntityIds.length).length * 8)}px` }}
            >
              {selectedEntityIds.length}
            </span>
            selected
          </div>
        </div>
        <BulkOperationsActionsRoot handleClearSelection={handleClearSelection} selectedEntityIds={selectedEntityIds} />
        <div className="h-7 pl-3 flex-grow">
          <IssueBulkOperationsProperties
            selectionHelpers={selectionHelpers}
            snapshot={{ isSelectionActive, selectedEntityIds }}
          />
        </div>
      </div>
    </div>
  );
});
