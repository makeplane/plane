import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Trash2 } from "lucide-react";
// ui
import { ArchiveIcon, Tooltip } from "@plane/ui";
// components
import {
  BulkArchiveConfirmationModal,
  BulkDeleteConfirmationModal,
  IssueBulkOperationsProperties,
} from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { TSelectionHelper, TSelectionSnapshot } from "@/hooks/use-entity-selection";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
  snapshot: TSelectionSnapshot;
};

export const IssueBulkOperationsRoot: React.FC<Props> = observer((props) => {
  const { className, selectionHelpers, snapshot } = props;
  // states
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // serviced values
  const { isSelectionActive, selectedEntityIds } = snapshot;
  const { handleClearSelection } = selectionHelpers;

  return (
    <>
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
        <div className="h-7 pr-3 text-sm flex items-center gap-2">
          <input type="checkbox" className="minus-checkbox" checked />
          <div className="flex items-center gap-1">
            {/* // TODO: add min width here */}
            <span className="flex-shrink-0">{selectedEntityIds.length}</span>selected
          </div>
        </div>
        <div className="h-7 px-3 flex items-center">
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
        </div>
        <div className="h-7 px-3 flex items-center">
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
        <div className="h-7 pl-3 flex items-center gap-3">
          <IssueBulkOperationsProperties selectionHelpers={selectionHelpers} snapshot={snapshot} />
        </div>
      </div>
    </>
  );
});
