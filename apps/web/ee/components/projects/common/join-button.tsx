import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
// plane imports
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { JoinProjectModal } from "@/components/project";
// plane web imports
import { TProject } from "@/plane-web/types/projects";

type Props = {
  project: TProject;
  className?: string;
};

const JoinButton: React.FC<Props> = (props) => {
  const { project, className } = props;
  // router
  const { workspaceSlug } = useParams();
  const router = useRouter();
  // states
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  // derived values
  const isMemberOfProject = !!project.member_role;

  return (
    <>
      {/* Join Project Modal */}
      {workspaceSlug && (
        <JoinProjectModal
          workspaceSlug={workspaceSlug.toString()}
          project={project}
          isOpen={joinProjectModalOpen}
          handleClose={() => setJoinProjectModal(false)}
        />
      )}
      {isMemberOfProject ? (
        <Link
          href={`/${workspaceSlug}/projects/${project.id}/issues`}
          tabIndex={-1}
          className={cn(
            "w-auto cursor-pointer rounded px-3 py-1.5 text-center text-sm font-medium outline-none my-0 flex-end bg-green-500/20 text-green-500 hover:bg-green-500/10 hover:text-green-500 focus:bg-green-500/20",
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMemberOfProject) {
              router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
            } else {
              setJoinProjectModal(true);
            }
          }}
        >
          {isMemberOfProject ? "Joined" : "Join"}
        </Link>
      ) : (
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className={cn(
            "w-auto cursor-pointer rounded px-3 py-1.5 text-center text-sm font-medium outline-none my-0 flex-end",
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMemberOfProject) {
              router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
            } else {
              setJoinProjectModal(true);
            }
          }}
        >
          {isMemberOfProject ? "Joined" : "Join"}
        </Button>
      )}
    </>
  );
};

export default JoinButton;
