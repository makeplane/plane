import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import projectService from "services/project.service";
// ui
import { PrimaryButton } from "components/ui";
// icons
import { AssignmentClipboardIcon } from "components/icons";
// images
import JoinProjectImg from "public/auth/project-not-authorized.svg";
// fetch-keys
import { USER_PROJECT_VIEW } from "constants/fetch-keys";

export const JoinProject: React.FC = () => {
  const [isJoiningProject, setIsJoiningProject] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const handleJoin = () => {
    if (!workspaceSlug || !projectId) return;

    setIsJoiningProject(true);
    projectService
      .joinProject(workspaceSlug as string, {
        project_ids: [projectId as string],
      })
      .then(async () => {
        await mutate(USER_PROJECT_VIEW(projectId.toString()));
        setIsJoiningProject(false);
      })
      .catch((err) => {
        console.error(err);
        setIsJoiningProject(false);
      });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-y-5 bg-custom-background-100 text-center">
      <div className="h-44 w-72">
        <Image src={JoinProjectImg} height="176" width="288" alt="JoinProject" />
      </div>
      <h1 className="text-xl font-medium text-custom-text-100">
        You are not a member of this project
      </h1>

      <div className="w-full max-w-md text-base text-custom-text-200">
        <p className="mx-auto w-full text-sm md:w-3/4">
          You are not a member of this project, but you can join this project by clicking the button
          below.
        </p>
      </div>
      <div>
        <PrimaryButton
          className="flex items-center gap-1"
          loading={isJoiningProject}
          onClick={handleJoin}
        >
          <AssignmentClipboardIcon height={16} width={16} color="white" />
          {isJoiningProject ? "Joining..." : "Click to join"}
        </PrimaryButton>
      </div>
    </div>
  );
};
