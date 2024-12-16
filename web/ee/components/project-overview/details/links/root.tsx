"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { ProjectLinkList } from "./links";
import { useLinks } from "./use-links";
// types

export type TProjectLinkRoot = {
  workspaceSlug: string;
  projectId: string;
  disabled?: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
};

export const ProjectLinkRoot: FC<TProjectLinkRoot> = observer((props) => {
  // props
  const { workspaceSlug, projectId, disabled = false } = props;
  // hooks
  const { handleLinkOperations } = useLinks(workspaceSlug, projectId);

  return <ProjectLinkList projectId={projectId} linkOperations={handleLinkOperations} disabled={disabled} />;
});
