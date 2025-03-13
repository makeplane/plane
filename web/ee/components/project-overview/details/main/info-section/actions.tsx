import { Link2, Paperclip } from "lucide-react";
import { ProjectAttachmentActionButton } from "../collaspible-section/attachment/quick-action-button";

type TProps = {
  toggleLinkModalOpen: (open: boolean) => void;
  workspaceSlug: string;
  projectId: string;
};
export const Actions = (props: TProps) => {
  const { toggleLinkModalOpen, workspaceSlug, projectId } = props;
  return (
    <div className="text-base font-medium flex gap-4 text-custom-text-200 my-auto">
      <button className="flex gap-1" onClick={() => toggleLinkModalOpen(true)}>
        <Link2 className="rotate-[135deg] my-auto" size={16} />
        <div>Add link</div>
      </button>
      <ProjectAttachmentActionButton
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        customButton={
          <button className="flex gap-1">
            <Paperclip className="my-auto" size={16} />
            <div>Attach</div>
          </button>
        }
      />
    </div>
  );
};
