"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// local components
import { ProjectLinkCreateUpdateModal } from "./collaspible-section/links/create-update-link-modal";
import { useLinks } from "./collaspible-section/links/use-links";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewModalRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;

  // helper hooks
  const { toggleLinkModal, handleLinkOperations, isLinkModalOpen, linkData, setLinkData } = useLinks(
    workspaceSlug.toString(),
    projectId.toString()
  );

  // handlers
  const handleOnClose = () => {
    toggleLinkModal(false);
  };
  return (
    <>
      <ProjectLinkCreateUpdateModal
        isModalOpen={isLinkModalOpen}
        handleOnClose={handleOnClose}
        linkOperations={handleLinkOperations}
        preloadedData={linkData}
        setLinkData={setLinkData}
      />
    </>
  );
});
