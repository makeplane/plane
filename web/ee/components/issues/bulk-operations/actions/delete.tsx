import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
// ui
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
import { setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web components
import { useUserPermissions } from "@/hooks/store";
import { BulkDeleteConfirmationModal } from "@/plane-web/components/issues";
// plane web constants

type Props = {
  handleClearSelection: () => void;
  selectedIssueIds: string[];
};

export const BulkDeleteIssues: React.FC<Props> = observer((props) => {
  const { handleClearSelection, selectedIssueIds } = props;
  // states
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  // store hooks
  const { projectId, workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();

  // derived values

  const canPerformProjectAdminActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  return (
    <>
      {projectId && workspaceSlug && (
        <BulkDeleteConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          handleClose={() => setIsBulkDeleteModalOpen(false)}
          issueIds={selectedIssueIds}
          onSubmit={handleClearSelection}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <Tooltip
        tooltipHeading="Delete"
        tooltipContent={canPerformProjectAdminActions ? "" : "You don't have permission to perform this action."}
      >
        <button
          type="button"
          className={cn("outline-none grid place-items-center", {
            "cursor-not-allowed text-custom-text-400": !canPerformProjectAdminActions,
          })}
          onClick={() =>
            canPerformProjectAdminActions
              ? setIsBulkDeleteModalOpen(true)
              : setToast({
                  type: TOAST_TYPE.ERROR,
                  title: "You don't have permission to perform this action.",
                })
          }
        >
          <Trash2 className="size-4" />
        </button>
      </Tooltip>
    </>
  );
});
