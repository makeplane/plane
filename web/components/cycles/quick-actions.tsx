import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { ArchiveRestoreIcon, LinkIcon, Pencil, Trash2 } from "lucide-react";
// ui
import { ArchiveIcon, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ArchiveCycleModal, CycleCreateUpdateModal, CycleDeleteModal } from "@/components/cycles";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useCycle, useEventTracker, useUser } from "@/hooks/store";

type Props = {
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
  isArchived?: boolean;
};

export const CycleQuickActions: React.FC<Props> = observer((props) => {
  const { cycleId, projectId, workspaceSlug, isArchived } = props;
  // router
  const router = useRouter();
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [archiveCycleModal, setArchiveCycleModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // store hooks
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { getCycleById, restoreCycle } = useCycle();
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

  const handleArchiveCycle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setArchiveCycleModal(true);
  };

  const handleRestoreCycle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await restoreCycle(workspaceSlug, projectId, cycleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your cycle can be found in project cycles.",
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Cycle could not be restored. Please try again.",
        })
      );
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
          <ArchiveCycleModal
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            cycleId={cycleId}
            isOpen={archiveCycleModal}
            handleClose={() => setArchiveCycleModal(false)}
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
        {!isCompleted && isEditingAllowed && !isArchived && (
          <CustomMenu.MenuItem onClick={handleEditCycle}>
            <span className="flex items-center justify-start gap-2">
              <Pencil className="h-3 w-3" />
              <span>Edit cycle</span>
            </span>
          </CustomMenu.MenuItem>
        )}
        {isEditingAllowed && !isArchived && (
          <CustomMenu.MenuItem onClick={handleArchiveCycle} disabled={!isCompleted}>
            {isCompleted ? (
              <div className="flex items-center gap-2">
                <ArchiveIcon className="h-3 w-3" />
                Archive cycle
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <ArchiveIcon className="h-3 w-3" />
                <div className="-mt-1">
                  <p>Archive cycle</p>
                  <p className="text-xs text-custom-text-400">
                    Only completed cycle <br /> can be archived.
                  </p>
                </div>
              </div>
            )}
          </CustomMenu.MenuItem>
        )}
        {isEditingAllowed && isArchived && (
          <CustomMenu.MenuItem onClick={handleRestoreCycle}>
            <span className="flex items-center justify-start gap-2">
              <ArchiveRestoreIcon className="h-3 w-3" />
              <span>Restore cycle</span>
            </span>
          </CustomMenu.MenuItem>
        )}
        {!isArchived && (
          <CustomMenu.MenuItem onClick={handleCopyText}>
            <span className="flex items-center justify-start gap-2">
              <LinkIcon className="h-3 w-3" />
              <span>Copy cycle link</span>
            </span>
          </CustomMenu.MenuItem>
        )}
        {!isCompleted && isEditingAllowed && (
          <div className="border-t pt-1 mt-1">
            <CustomMenu.MenuItem onClick={handleDeleteCycle}>
              <span className="flex items-center justify-start gap-2">
                <Trash2 className="h-3 w-3" />
                <span>Delete cycle</span>
              </span>
            </CustomMenu.MenuItem>
          </div>
        )}
      </CustomMenu>
    </>
  );
});
