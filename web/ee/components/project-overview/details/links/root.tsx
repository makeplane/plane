"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
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
  const { handleLinkOperations, fetchLinks } = useLinks(workspaceSlug, projectId);
  // api calls
  useSWR(
    projectId && workspaceSlug ? `PROJECT_LINKS_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchLinks(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  return <ProjectLinkList projectId={projectId} linkOperations={handleLinkOperations} disabled={disabled} />;
});
