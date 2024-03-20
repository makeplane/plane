import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { ArchiveRestoreIcon, LinkIcon, Pencil, Trash2 } from "lucide-react";
// ui
import { ArchiveIcon, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ArchiveModuleModal, CreateUpdateModuleModal, DeleteModuleModal } from "@/components/modules";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useModule, useEventTracker, useUser } from "@/hooks/store";

type Props = {
  moduleId: string;
  projectId: string;
  workspaceSlug: string;
  isArchived?: boolean;
};

export const ModuleQuickActions: React.FC<Props> = observer((props) => {
  const { moduleId, projectId, workspaceSlug, isArchived } = props;
  // router
  const router = useRouter();
  // states
  const [editModal, setEditModal] = useState(false);
  const [archiveModuleModal, setArchiveModuleModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // store hooks
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { getModuleById, restoreModule } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);
  // auth
  const isEditingAllowed =
    !!currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId] >= EUserProjectRoles.MEMBER;

  const moduleState = moduleDetails?.status.toLocaleLowerCase();
  const isInArchivableGroup = !!moduleState && ["completed", "cancelled"].includes(moduleState);

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/modules/${moduleId}`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Module link copied to clipboard.",
      });
    });
  };

  const handleEditModule = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTrackElement("Modules page list layout");
    setEditModal(true);
  };

  const handleArchiveModule = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setArchiveModuleModal(true);
  };

  const handleRestoreModule = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await restoreModule(workspaceSlug, projectId, moduleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your module can be found in project modules.",
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/modules/${moduleId}`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Module could not be restored. Please try again.",
        })
      );
  };

  const handleDeleteModule = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTrackElement("Modules page list layout");
    setDeleteModal(true);
  };

  return (
    <>
      {moduleDetails && (
        <div className="fixed">
          <CreateUpdateModuleModal
            isOpen={editModal}
            onClose={() => setEditModal(false)}
            data={moduleDetails}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
          <ArchiveModuleModal
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            moduleId={moduleId}
            isOpen={archiveModuleModal}
            handleClose={() => setArchiveModuleModal(false)}
          />
          <DeleteModuleModal data={moduleDetails} isOpen={deleteModal} onClose={() => setDeleteModal(false)} />
        </div>
      )}
      <CustomMenu ellipsis placement="left-start">
        {isEditingAllowed && !isArchived && (
          <CustomMenu.MenuItem onClick={handleEditModule}>
            <span className="flex items-center justify-start gap-2">
              <Pencil className="h-3 w-3" />
              <span>Edit module</span>
            </span>
          </CustomMenu.MenuItem>
        )}
        {isEditingAllowed && !isArchived && (
          <CustomMenu.MenuItem onClick={handleArchiveModule} disabled={!isInArchivableGroup}>
            {isInArchivableGroup ? (
              <div className="flex items-center gap-2">
                <ArchiveIcon className="h-3 w-3" />
                Archive module
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <ArchiveIcon className="h-3 w-3" />
                <div className="-mt-1">
                  <p>Archive module</p>
                  <p className="text-xs text-custom-text-400">
                    Only completed or cancelled <br /> module can be archived.
                  </p>
                </div>
              </div>
            )}
          </CustomMenu.MenuItem>
        )}
        {isEditingAllowed && isArchived && (
          <CustomMenu.MenuItem onClick={handleRestoreModule}>
            <span className="flex items-center justify-start gap-2">
              <ArchiveRestoreIcon className="h-3 w-3" />
              <span>Restore module</span>
            </span>
          </CustomMenu.MenuItem>
        )}
        {!isArchived && (
          <CustomMenu.MenuItem onClick={handleCopyText}>
            <span className="flex items-center justify-start gap-2">
              <LinkIcon className="h-3 w-3" />
              <span>Copy module link</span>
            </span>
          </CustomMenu.MenuItem>
        )}
        {isEditingAllowed && (
          <div className="border-t pt-1 mt-1">
            <CustomMenu.MenuItem onClick={handleDeleteModule}>
              <span className="flex items-center justify-start gap-2">
                <Trash2 className="h-3 w-3" />
                <span>Delete module</span>
              </span>
            </CustomMenu.MenuItem>
          </div>
        )}
      </CustomMenu>
    </>
  );
});
