import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@plane/editor";
import { Button } from "@plane/ui";
import { JoinProjectModal } from "@/components/project";
import { TProject } from "@/plane-web/types/projects";

type Props = {
  project: TProject;
  className?: string;
};
const JoinButton: React.FC<Props> = (props) => {
  const { project, className } = props;
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  const { workspaceSlug } = useParams();
  const router = useRouter();

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
      {project.is_member ? (
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
            project.is_member
              ? router.push(`/${workspaceSlug}/projects/${project.id}/issues`)
              : setJoinProjectModal(true);
          }}
        >
          {project.is_member ? "Joined" : "Join"}
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
            project.is_member
              ? router.push(`/${workspaceSlug}/projects/${project.id}/issues`)
              : setJoinProjectModal(true);
          }}
        >
          {project.is_member ? "Joined" : "Join"}
        </Button>
      )}
    </>
  );
};
export default JoinButton;
