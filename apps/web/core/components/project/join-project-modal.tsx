"use client";

import { useState } from "react";
// types
import type { IProject } from "@plane/types";
// ui
import { Button, Dialog, EModalWidth } from "@plane/ui";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

// type
type TJoinProjectModalProps = {
  isOpen: boolean;
  workspaceSlug: string;
  project: IProject;
  handleClose: () => void;
};

export const JoinProjectModal: React.FC<TJoinProjectModalProps> = (props) => {
  const { handleClose, isOpen, project, workspaceSlug } = props;
  // states
  const [isJoiningLoading, setIsJoiningLoading] = useState(false);
  // store hooks
  const { joinProject } = useUserPermissions();
  const { fetchProjectDetails } = useProject();
  // router
  const router = useAppRouter();

  const handleJoin = () => {
    setIsJoiningLoading(true);

    joinProject(workspaceSlug, project.id)
      .then(() => {
        router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
        fetchProjectDetails(workspaceSlug, project.id);
        handleClose();
      })
      .finally(() => {
        setIsJoiningLoading(false);
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XL}>
        <div className="space-y-5">
          <Dialog.Title className="text-lg font-medium leading-6 text-custom-text-100">Join Project?</Dialog.Title>
          <p>
            Are you sure you want to join the project <span className="break-words font-semibold">{project?.name}</span>
            ? Please click the &apos;Join Project&apos; button below to continue.
          </p>
          <div className="space-y-3" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            tabIndex={1}
            type="submit"
            onClick={handleJoin}
            loading={isJoiningLoading}
          >
            {isJoiningLoading ? "Joining..." : "Join Project"}
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
