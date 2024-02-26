import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
// hooks
import { useProject, useUser } from "hooks/store";
// ui
import { Button } from "@plane/ui";
// icons
import { ClipboardList } from "lucide-react";
// images
import JoinProjectImg from "public/auth/project-not-authorized.svg";

export const JoinProject: React.FC = () => {
  // states
  const [isJoiningProject, setIsJoiningProject] = useState(false);
  // store hooks
  const {
    membership: { joinProject },
  } = useUser();
  const { fetchProjects } = useProject();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const handleJoin = () => {
    if (!workspaceSlug || !projectId) return;

    setIsJoiningProject(true);

    joinProject(workspaceSlug.toString(), [projectId.toString()])
      .then(() => fetchProjects(workspaceSlug.toString()))
      .finally(() => setIsJoiningProject(false));
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-y-5 bg-custom-background-100 text-center">
      <div className="h-44 w-72">
        <Image src={JoinProjectImg} height="176" width="288" alt="JoinProject" />
      </div>
      <h1 className="text-xl font-medium text-custom-text-100">You are not a member of this project</h1>

      <div className="w-full max-w-md text-base text-custom-text-200">
        <p className="mx-auto w-full text-sm md:w-3/4">
          You are not a member of this project, but you can join this project by clicking the button below.
        </p>
      </div>
      <div>
        <Button
          variant="primary"
          prependIcon={<ClipboardList color="white" />}
          loading={isJoiningProject}
          onClick={handleJoin}
        >
          {isJoiningProject ? "Joining..." : "Click to join"}
        </Button>
      </div>
    </div>
  );
};
