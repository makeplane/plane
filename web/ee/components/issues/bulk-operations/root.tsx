import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Button, Checkbox, Tooltip } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// hooks
import { useMultipleSelectStore } from "@/hooks/store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// plane-web
import { BulkOperationsActionsRoot, IssueBulkOperationsProperties } from "@/plane-web/components/issues";
import { UpgradeToast } from "@/plane-web/components/workspace";
import { hideFloatingBot, showFloatingBot } from "@/plane-web/helpers/pi-chat.helper";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot: React.FC<Props> = observer((props) => {
  const { className, selectionHelpers } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { isSelectionActive, selectedEntityIds } = useMultipleSelectStore();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isBulkOpsEnabled = useFlag(workspaceSlug?.toString(), "BULK_OPS_ONE");
  const { handleClearSelection } = selectionHelpers;

  useEffect(() => {
    if (isSelectionActive) {
      hideFloatingBot();
    }
    if (!isSelectionActive) {
      showFloatingBot();
    }
  }, [isSelectionActive]);

  if (!isSelectionActive || selectionHelpers.isSelectionDisabled) return null;

  return (
    <div className={cn("sticky bottom-0 left-0 z-10 h-14", className)}>
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
        <Tooltip
          position="top-right"
          className="mb-4 rounded-lg shadow"
          disabled={isBulkOpsEnabled}
          tooltipContent={<UpgradeToast />}
        >
          <div className="flex w-full overflow-hidden overflow-x-auto">
            <div
              className={cn("flex grow", {
                "opacity-50 pointer-events-none": !isBulkOpsEnabled,
              })}
            >
              <BulkOperationsActionsRoot
                handleClearSelection={handleClearSelection}
                selectedEntityIds={selectedEntityIds}
              />
              <div className="h-7 pl-3 flex-grow">
                <IssueBulkOperationsProperties
                  selectionHelpers={selectionHelpers}
                  snapshot={{ isSelectionActive, selectedEntityIds }}
                />
              </div>
            </div>
            {!isBulkOpsEnabled && (
              <div className="flex-shrink-0">
                <Button variant="accent-primary" size="sm" onClick={() => togglePaidPlanModal(true)}>
                  Upgrade
                </Button>
              </div>
            )}
          </div>
        </Tooltip>
      </div>
    </div>
  );
});
