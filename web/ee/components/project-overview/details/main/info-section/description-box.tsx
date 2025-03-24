"use client";
import { useState } from "react";
import { observer } from "mobx-react";
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
  disabled?: boolean;
};
export const DescriptionBox = observer((props: TProps) => {
  const { workspaceSlug, project, handleProjectUpdate, toggleLinkModalOpen, disabled = false } = props;
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");

  // hooks
  const { data: currentUser } = useUser();

  return (
    <div className="flex flex-col gap-4 w-full text-2xl pt-4 px-10">
      <ProjectDescriptionInput
        workspaceSlug={workspaceSlug}
        project={project}
        initialValue={project?.description_html}
        handleUpdate={handleProjectUpdate}
        setIsSubmitting={setIsSubmitting}
        containerClassName="px-0 text-base min-h-[200px] w-full"
        disabled={disabled}
      />
      <div className="flex items-center justify-between w-full gap-2 pb-6 border-b border-custom-border-200">
        <ProjectReaction workspaceSlug={workspaceSlug} projectId={project.id} currentUser={currentUser} />
        <Actions toggleLinkModalOpen={toggleLinkModalOpen} workspaceSlug={workspaceSlug} projectId={project.id} />
      </div>
    </div>
  );
});
