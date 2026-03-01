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
import { ProjectStateLoader } from "@/components/project-states";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { WorkflowStateList } from "./workflow-state-list";

type TProjectState = {
  workspaceSlug: string;
  projectId: string;
};

export const StateWorkflowRoot = observer(function StateWorkflowRoot(props: TProjectState) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { projectStates } = useProjectState();

  // Loader
  if (!projectStates) return <ProjectStateLoader />;

  return (
    <div className="h-full overflow-auto vertical-scrollbar scrollbar-sm">
      <WorkflowStateList workspaceSlug={workspaceSlug} projectId={projectId} states={projectStates} />
    </div>
  );
});
