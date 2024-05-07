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
import { useBulkIssueOperations } from "@/hooks/store";

export const IssueBulkOperationsRoot = observer(() => {
  // states
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { issueIds } = useBulkIssueOperations();

  return (
    <>
      {workspaceSlug && projectId && (
        <BulkArchiveConfirmationModal
          isOpen={isBulkArchiveModalOpen}
          handleClose={() => setIsBulkArchiveModalOpen(false)}
          issueIds={issueIds}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      {workspaceSlug && projectId && (
        <BulkDeleteConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          handleClose={() => setIsBulkDeleteModalOpen(false)}
          issueIds={issueIds}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <div className="h-full w-full bg-custom-background-100 border-t border-custom-border-200 py-4 px-3.5 flex items-center divide-x-[0.5px] divide-custom-border-200 text-custom-text-300">
        <div className="h-7 pr-3 text-sm flex items-center">2 selected</div>
        <div className="h-7 px-3 flex items-center">
          <Tooltip tooltipContent="Archive">
            <button
              type="button"
              className={cn("outline-none grid place-items-center", {
                "cursor-not-allowed text-custom-text-400": issueIds.length === 0,
              })}
              onClick={() => {
                if (issueIds.length > 0) setIsBulkArchiveModalOpen(true);
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
                "cursor-not-allowed text-custom-text-400": issueIds.length === 0,
              })}
              onClick={() => {
                if (issueIds.length > 0) setIsBulkDeleteModalOpen(true);
              }}
            >
              <Trash2 className="size-4" />
            </button>
          </Tooltip>
        </div>
        <div className="h-7 pl-3 flex items-center gap-3">
          <IssueBulkOperationsProperties />
        </div>
      </div>
    </>
  );
});
