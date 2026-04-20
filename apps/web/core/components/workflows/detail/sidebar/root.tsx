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
import { cn } from "@plane/utils";
import { observer } from "mobx-react";
import { WorkflowConfigSidebarContent } from "./content";
import type { IWorkflow } from "@plane/types";

type Props = {
  workflow: IWorkflow;
  workspaceSlug: string;
  projectId: string;
};

export const WorkflowConfigSidebarRoot = observer(function WorkflowConfigSidebarRoot(props: Props) {
  const { workflow, workspaceSlug, projectId } = props;
  const stateId = workflow.activeSidebarStateId;
  const transitionId = workflow.activeSidebarTransitionId;
  const state = stateId ? workflow.getStateById(stateId) : undefined;
  const transition = state && transitionId ? state.getTransitionById(transitionId) : undefined;
  const helper = state?.sidebarHelper;

  if (!workflow.permissions.canEdit || !stateId || !state || !helper || !transition) return <></>;

  const isConditionsTab = helper.selectedTab === "conditions";

  return (
    <aside
      className={cn(
        "shrink-0 h-full w-[320px] -mr-[320px] flex min-h-0 flex-col bg-surface-1 border-l border-subtle-1 space-y-6 transition-all",
        {
          "mr-0": workflow.isSidebarOpen,
          "overflow-hidden": isConditionsTab,
          "overflow-y-scroll vertical-scrollbar scrollbar-sm": !isConditionsTab,
        }
      )}
    >
      <WorkflowConfigSidebarContent
        workflow={workflow}
        stateId={stateId}
        transition={transition}
        helper={helper}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />
    </aside>
  );
});
