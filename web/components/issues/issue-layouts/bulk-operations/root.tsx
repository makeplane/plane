import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Trash2 } from "lucide-react";
// ui
import { ArchiveIcon, Checkbox, Tooltip } from "@plane/ui";
// components
import {
  BulkArchiveConfirmationModal,
  BulkDeleteConfirmationModal,
  IssueBulkOperationsProperties,
} from "@/components/issues";
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
  // states
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // serviced values
  const { isSelectionActive, selectedEntityIds } = useMultipleSelectStore();
  const { handleClearSelection } = selectionHelpers;

  if (!isSelectionActive) return null;

  return (
    <div className="sticky bottom-0 left-0 z-[2] h-14">
      {workspaceSlug && projectId && (
        <>
          <BulkArchiveConfirmationModal
            isOpen={isBulkArchiveModalOpen}
            handleClose={() => setIsBulkArchiveModalOpen(false)}
            issueIds={selectedEntityIds}
            onSubmit={handleClearSelection}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
          <BulkDeleteConfirmationModal
            isOpen={isBulkDeleteModalOpen}
            handleClose={() => setIsBulkDeleteModalOpen(false)}
            issueIds={selectedEntityIds}
            onSubmit={handleClearSelection}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
        </>
      )}
      <div
        className={cn(
          "size-full bg-custom-background-100 border-t border-custom-border-200 py-4 px-3.5 flex items-center divide-x-[0.5px] divide-custom-border-200 text-custom-text-300",
          className
        )}
      >
        <div className="h-7 pr-3 text-sm flex items-center gap-2 flex-shrink-0">
          <Checkbox
            className="!outline-none size-3.5"
            iconClassName="size-3"
            onClick={selectionHelpers.handleClearSelection}
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
        <div className="h-7 px-3 flex items-center gap-3 flex-shrink-0">
          <Tooltip tooltipContent="Archive">
            <button
              type="button"
              className={cn("outline-none grid place-items-center", {
                "cursor-not-allowed text-custom-text-400": !isSelectionActive,
              })}
              onClick={() => {
                if (isSelectionActive) setIsBulkArchiveModalOpen(true);
              }}
            >
              <ArchiveIcon className="size-4" />
            </button>
          </Tooltip>
          <Tooltip tooltipContent="Delete">
            <button
              type="button"
              className={cn("outline-none grid place-items-center", {
                "cursor-not-allowed text-custom-text-400": !isSelectionActive,
              })}
              onClick={() => {
                if (isSelectionActive) setIsBulkDeleteModalOpen(true);
              }}
            >
              <Trash2 className="size-4" />
            </button>
          </Tooltip>
        </div>
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
