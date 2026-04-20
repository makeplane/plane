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

import { observer } from "mobx-react";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// local imports
import { BaseTimelineRoot } from "../base-timeline-root";

type TProjectTimelineLayoutProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectTimelineLayout = observer(function ProjectTimelineLayout(props: TProjectTimelineLayoutProps) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { permissions } = useIssues(EIssuesStoreType.PROJECT);

  return (
    <BaseTimelineRoot
      layoutPermissions={{
        canCreateWorkItem: {
          viaQuickAdd: projectId ? permissions.getCanCreate(workspaceSlug, projectId) : false,
        },
        canEditViaTimeline: (blockId, meta) =>
          meta?.project_id ? permissions.getCanEdit(workspaceSlug, meta.project_id, blockId) : false,
      }}
    />
  );
});
