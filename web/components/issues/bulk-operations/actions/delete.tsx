import { useState } from "react";
import { observer } from "mobx-react";
import { Trash2 } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/store";
import { BulkDeleteConfirmationModal } from "../bulk-delete-modal";

type Props = {
  handleClearSelection: () => void;
  selectedEntityIds: string[];
};

export const BulkDeleteIssues: React.FC<Props> = observer((props) => {
  const { handleClearSelection, selectedEntityIds } = props;
  // states
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  // store hooks
  const { projectId, workspaceSlug } = useAppRouter();

  return (
    <>
      {projectId && workspaceSlug && (
        <BulkDeleteConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          handleClose={() => setIsBulkDeleteModalOpen(false)}
          issueIds={selectedEntityIds}
          onSubmit={handleClearSelection}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <Tooltip tooltipHeading="Delete" tooltipContent="">
        <button
          type="button"
          className="outline-none grid place-items-center"
          onClick={() => setIsBulkDeleteModalOpen(true)}
        >
          <Trash2 className="size-4" />
        </button>
      </Tooltip>
    </>
  );
});
