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
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// constants
import { BaseTimelineRoot } from "../base-timeline-root";

type TProjectViewTimelineLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  viewId: string;
};

export const ProjectViewTimelineLayout = observer(function ProjectViewTimelineLayout(
  props: TProjectViewTimelineLayoutProps
) {
  const { workspaceSlug, projectId, viewId } = props;
  // hooks
  const { permissions } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  return (
    <BaseTimelineRoot
      layoutPermissions={{
        canCreateWorkItem: {
          viaQuickAdd: permissions.getCanCreate(workspaceSlug, projectId),
        },
        canEditViaTimeline: (blockId, meta) =>
          meta?.project_id ? permissions.getCanEdit(workspaceSlug, meta.project_id, blockId) : false,
      }}
      viewId={viewId}
    />
  );
});
