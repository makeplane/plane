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
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";
// constants
import { BaseTimelineRoot } from "../base-timeline-root";

type TEpicTimelineLayoutProps = {
  workspaceSlug: string;
  projectId: string;
};

export const EpicTimelineLayout = observer(function EpicTimelineLayout(props: TEpicTimelineLayoutProps) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { permissions } = useEpics();

  return (
    <BaseTimelineRoot
      layoutPermissions={{
        canCreateWorkItem: {
          viaQuickAdd: permissions.getCanCreate(workspaceSlug, projectId),
        },
        canEditViaTimeline: (blockId, meta) =>
          meta?.project_id ? permissions.getCanEdit(workspaceSlug, meta.project_id, blockId) : false,
      }}
      isEpic
    />
  );
});
