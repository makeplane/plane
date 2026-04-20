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

// plane imports
import { GANTT_TIMELINE_TYPE, INITIATIVE_SCOPE_TABS } from "@plane/types";
// components
import { TimeLineTypeContext } from "@/components/timeline/contexts";
import { ScopeTimelineChartRoot } from "../timeline/chart-root";

type Props = {
  epicIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  permissions: {
    canEditEpic: (epicId: string) => boolean;
  };
  handleAddEpic: () => void;
  handleAddProject: () => void;
};

export function InitiativeScopeEpicTimeline(props: Props) {
  const { epicIds, workspaceSlug, initiativeId, permissions, handleAddEpic, handleAddProject } = props;

  return (
    <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.ISSUE}>
      <ScopeTimelineChartRoot
        activeTab={INITIATIVE_SCOPE_TABS.EPICS}
        epicIds={epicIds}
        projectIds={[]}
        workspaceSlug={workspaceSlug}
        handleAddEpic={handleAddEpic}
        handleAddProject={handleAddProject}
        initiativeId={initiativeId}
        permissions={{
          canEditViaTimeline: (blockId: string) => permissions.canEditEpic(blockId),
        }}
      />
    </TimeLineTypeContext.Provider>
  );
}
