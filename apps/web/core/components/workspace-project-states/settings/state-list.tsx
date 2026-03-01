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
import { ProjectStateListItem } from "@/components/workspace-project-states";
// plane web types
import type { TProjectStateGroupKey, TProjectStateIdsByGroup } from "@/types/workspace-project-states";

type TStateList = {
  workspaceSlug: string;
  workspaceId: string;
  groupProjectStates: TProjectStateIdsByGroup;
  groupKey: TProjectStateGroupKey;
  groupStateIds: string[];
};

export const ProjectStateList = observer(function ProjectStateList(props: TStateList) {
  const { workspaceSlug, workspaceId, groupProjectStates, groupKey, groupStateIds } = props;

  return (
    <>
      {groupStateIds.map((stateId) => (
        <ProjectStateListItem
          key={stateId}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          groupProjectStates={groupProjectStates}
          groupKey={groupKey}
          projectStateId={stateId}
        />
      ))}
    </>
  );
});
