import { FC } from "react";
import { observer } from "mobx-react";
// computed
import { useProjectLinks } from "@/plane-web/hooks/store";
import { ProjectLinkDetail } from "./link-detail";
import { TLinkOperations } from "./use-links";
// hooks

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TProjectLinkList = {
  projectId: string;
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
};

export const ProjectLinkList: FC<TProjectLinkList> = observer((props) => {
  // props
  const { projectId, linkOperations, disabled = false } = props;
  // hooks
  const { getLinksByProjectId } = useProjectLinks();

  const projectLinks = getLinksByProjectId(projectId);

  if (!projectLinks) return <></>;

  return (
    <div className="flex flex-col gap-2 py-4">
      {projectLinks &&
        projectLinks.length > 0 &&
        projectLinks.map((linkId) => (
          <ProjectLinkDetail key={linkId} linkId={linkId} linkOperations={linkOperations} isNotAllowed={disabled} />
        ))}
    </div>
  );
});
