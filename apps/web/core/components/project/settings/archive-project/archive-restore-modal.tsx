"use client";

import { useState } from "react";
// ui
import { Button, TOAST_TYPE, setToast, Dialog, EModalWidth } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;

  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  archive: boolean;
};

export const ArchiveRestoreProjectModal: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId, isOpen, onClose, archive } = props;
  // router
  const router = useAppRouter();
  // states
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { getProjectById, archiveProject, restoreProject } = useProject();

  const projectDetails = getProjectById(projectId);
  if (!projectDetails) return null;

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  const handleArchiveProject = async () => {
    setIsLoading(true);
    await archiveProject(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Archive success",
          message: `${projectDetails.name} has been archived successfully`,
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Project could not be archived. Please try again.",
        })
      )
      .finally(() => setIsLoading(false));
  };

  const handleRestoreProject = async () => {
    setIsLoading(true);
    await restoreProject(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: `You can find ${projectDetails.name} in your projects.`,
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Project could not be restored. Please try again.",
        })
      )
      .finally(() => setIsLoading(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.LG}>
        <div className="px-5 py-4">
          <h3 className="text-xl font-medium 2xl:text-2xl">
            {archive ? "Archive" : "Restore"} {projectDetails.name}
          </h3>
          <p className="mt-3 text-sm text-custom-text-200">
            {archive
              ? "This project and its work items, cycles, modules, and pages will be archived. Its work items won’t appear in search. Only project admins can restore the project."
              : "Restoring a project will activate it and make it visible to all members of the project. Are you sure you want to continue?"}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              tabIndex={1}
              onClick={archive ? handleArchiveProject : handleRestoreProject}
              loading={isLoading}
            >
              {archive ? (isLoading ? "Archiving" : "Archive") : isLoading ? "Restoring" : "Restore"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
