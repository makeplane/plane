import { FC } from "react";
import { observer } from "mobx-react";
// computed
import { useWorkspace } from "@/hooks/store";
import { ProjectLinkDetail } from "./link-detail";
import { TLinkOperations } from "./use-links";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TProjectLinkList = {
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
  workspaceSlug: string;
};

export const ProjectLinkList: FC<TProjectLinkList> = observer((props) => {
  // props
  const { linkOperations, workspaceSlug, disabled = false } = props;
  // hooks
  const {
    links: { getLinksByWorkspaceId },
  } = useWorkspace();

  const projectLinks = getLinksByWorkspaceId(workspaceSlug);

  if (!projectLinks) return <></>;

  return (
    <div className="space-y-2 mb-2">
      {projectLinks &&
        projectLinks.length > 0 &&
        projectLinks.map((linkId) => (
          <ProjectLinkDetail key={linkId} linkId={linkId} linkOperations={linkOperations} isNotAllowed={disabled} />
        ))}
    </div>
  );
});
