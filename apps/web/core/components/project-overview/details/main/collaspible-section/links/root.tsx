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

export const ProjectLinkRoot = observer(function ProjectLinkRoot(props: TProjectLinkRoot) {
  // props
  const { workspaceSlug, projectId, disabled = false } = props;
  // hooks
  const { handleLinkOperations } = useLinks(workspaceSlug, projectId);

  return <ProjectLinkList projectId={projectId} linkOperations={handleLinkOperations} disabled={disabled} />;
});
