/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
// local components
import { ProjectLinkCreateUpdateModal } from "./collaspible-section/links/create-update-link-modal";
import { useLinks } from "./collaspible-section/links/use-links";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewModalRoot = observer(function ProjectOverviewModalRoot(props: Props) {
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
