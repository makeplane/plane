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
// computed
import { useProjectLinks } from "@/plane-web/hooks/store";
import { ProjectLinkDetail } from "./link-detail";
import type { TLinkOperations } from "./use-links";
// hooks

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TProjectLinkList = {
  projectId: string;
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
};

export const ProjectLinkList = observer(function ProjectLinkList(props: TProjectLinkList) {
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
