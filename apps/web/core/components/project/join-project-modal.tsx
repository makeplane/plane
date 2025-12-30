import { useState } from "react";
// types
import { Button } from "@plane/propel/button";
import type { IProject } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

// type
type TJoinProjectModalProps = {
  isOpen: boolean;
  workspaceSlug: string;
  project: IProject;
  handleClose: () => void;
};

export function JoinProjectModal(props: TJoinProjectModalProps) {
  const { handleClose, isOpen, project, workspaceSlug } = props;
  // states
  const [isJoiningLoading, setIsJoiningLoading] = useState(false);
  // store hooks
  const { joinProject } = useUserPermissions();
  // router
  const router = useAppRouter();

  const handleJoin = async () => {
    setIsJoiningLoading(true);

    await joinProject(workspaceSlug, project.id)
      .then(() => {
        router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
        handleClose();
        return;
      })
      .catch(() => {
        console.error("Error joining project");
      })
      .finally(() => {
        setIsJoiningLoading(false);
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="space-y-5 px-5 py-8 sm:p-6">
        <h3 className="text-16 font-medium leading-6 text-primary">Join Project?</h3>
        <p>
          Are you sure you want to join the project <span className="break-words font-semibold">{project?.name}</span>?
          Please click the &apos;Join Project&apos; button below to continue.
        </p>
        <div className="space-y-3" />
      </div>
      <div className="mt-5 flex justify-end gap-2 px-5 pb-8 sm:px-6 sm:pb-6">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" tabIndex={1} type="submit" onClick={handleJoin} loading={isJoiningLoading}>
          {isJoiningLoading ? "Joining..." : "Join Project"}
        </Button>
      </div>
    </ModalCore>
  );
}
