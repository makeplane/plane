import { useState } from "react";
import { useUser } from "@/hooks/store";
import { TProject } from "@/plane-web/types";
import { Actions } from "./actions";
import { ProjectDescriptionInput } from "./description-input";
import { ProjectReaction } from "./update-reaction";

type TProps = {
  workspaceSlug: string;
  project: TProject;
  handleProjectUpdate: (data: Partial<TProject>) => Promise<void>;
  toggleLinkModalOpen: (value: boolean) => void;
};
export const DescriptionBox = (props: TProps) => {
  const { workspaceSlug, project, handleProjectUpdate, toggleLinkModalOpen } = props;
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");

  // hooks
  const { data: currentUser } = useUser();

  return (
    <div className="flex flex-col gap-4 w-full text-2xl px-10">
      <ProjectDescriptionInput
        workspaceSlug={workspaceSlug}
        project={project}
        initialValue={project?.description_html}
        handleUpdate={handleProjectUpdate}
        setIsSubmitting={setIsSubmitting}
        containerClassName="px-0 text-base min-h-[200px] w-full"
      />
      <div className="flex items-center justify-between w-full gap-2 pb-6 border-b border-custom-border-200">
        <ProjectReaction workspaceSlug={workspaceSlug} projectId={project.id} currentUser={currentUser} />
        <Actions toggleLinkModalOpen={toggleLinkModalOpen} workspaceSlug={workspaceSlug} projectId={project.id} />
      </div>
    </div>
  );
};
