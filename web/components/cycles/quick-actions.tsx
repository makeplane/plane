import { useState } from "react";
import { observer } from "mobx-react";
import { LinkIcon, Pencil, Trash2 } from "lucide-react";
// hooks
// components
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
import { CycleCreateUpdateModal, CycleDeleteModal } from "@/components/cycles";
// ui
// helpers
import { EUserProjectRoles } from "@/constants/project";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// constants
import { useCycle, useEventTracker, useUser } from "@/hooks/store";

type Props = {
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
};

export const CycleQuickActions: React.FC<Props> = observer((props) => {
  const { cycleId, projectId, workspaceSlug } = props;
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // store hooks
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { getCycleById } = useCycle();
  // derived values
  const cycleDetails = getCycleById(cycleId);
  const isCompleted = cycleDetails?.status.toLowerCase() === "completed";
  // auth
  const isEditingAllowed =
    !!currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId] >= EUserProjectRoles.MEMBER;

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Cycle link copied to clipboard.",
      });
    });
  };

  const handleEditCycle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTrackElement("Cycles page list layout");
    setUpdateModal(true);
  };

  const handleDeleteCycle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTrackElement("Cycles page list layout");
    setDeleteModal(true);
  };

  return (
    <>
      {cycleDetails && (
        <div className="fixed">
          <CycleCreateUpdateModal
            data={cycleDetails}
            isOpen={updateModal}
            handleClose={() => setUpdateModal(false)}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
          <CycleDeleteModal
            cycle={cycleDetails}
            isOpen={deleteModal}
            handleClose={() => setDeleteModal(false)}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
        </div>
      )}
      <CustomMenu ellipsis placement="bottom-end">
        {!isCompleted && isEditingAllowed && (
          <>
            <CustomMenu.MenuItem onClick={handleEditCycle}>
              <span className="flex items-center justify-start gap-2">
                <Pencil className="h-3 w-3" />
                <span>Edit cycle</span>
              </span>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={handleDeleteCycle}>
              <span className="flex items-center justify-start gap-2">
                <Trash2 className="h-3 w-3" />
                <span>Delete cycle</span>
              </span>
            </CustomMenu.MenuItem>
          </>
        )}
        <CustomMenu.MenuItem onClick={handleCopyText}>
          <span className="flex items-center justify-start gap-2">
            <LinkIcon className="h-3 w-3" />
            <span>Copy cycle link</span>
          </span>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </>
  );
});
