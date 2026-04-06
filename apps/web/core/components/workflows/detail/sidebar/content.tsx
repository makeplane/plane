/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import type { IWorkflow, IWorkflowSidebarHelper, IWorkflowTransition } from "@plane/types";
import { cn } from "@plane/propel/utils";
import { ConditionsTabContent } from "./tabs/conditions/root";
import { FlowTypeTabContent } from "./tabs/flow-type/root";
import { MembersTabContent } from "./tabs/members/root";
import { StatesTabContent } from "./tabs/states/root";
import { IconButton } from "@plane/propel/icon-button";
import { ArrowRightIcon } from "@plane/propel/icons";
import { useRunners } from "@/hooks/store/runners/use-runners";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

type Props = {
  workflow: IWorkflow;
  stateId: string;
  transition: IWorkflowTransition;
  helper: IWorkflowSidebarHelper;
  workspaceSlug: string;
  projectId: string;
};

export const WorkflowConfigSidebarContent = observer(function WorkflowConfigSidebarContent(props: Props) {
  const { workflow, helper, stateId, transition, workspaceSlug, projectId } = props;

  const { isRunnerAvailable } = useRunners();
  const state = workflow.getStateById(stateId);
  const runnerHealthy = isRunnerAvailable(workspaceSlug);
  const isProjectGroupingFeatureFlagEnabled = useFlag(workspaceSlug, "PLANE_RUNNER");
  const isWorkflowConditionsFeatureFlagEnabled = useFlag(workspaceSlug, "WORKFLOW_CONDITIONS");
  const isWorkflowConditionsEnabled =
    runnerHealthy && isWorkflowConditionsFeatureFlagEnabled && isProjectGroupingFeatureFlagEnabled;
  if (!state) return <></>;

  const renderSidebarContent = () => {
    switch (helper.selectedTab) {
      case "flow_type":
        return (
          <FlowTypeTabContent
            onNext={() => helper.selectTab("states")}
            state={state}
            workflow={workflow}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
        );
      case "states":
        return (
          <StatesTabContent
            workflow={workflow}
            state={state}
            transition={transition}
            onNext={() => helper.selectTab("members")}
          />
        );
      case "members":
        return (
          <MembersTabContent
            state={state}
            transition={transition}
            onNext={() => (isWorkflowConditionsEnabled ? helper.selectTab("conditions") : workflow.closeSidebar())}
          />
        );
      case "conditions":
        return (
          <ConditionsTabContent
            state={state}
            transition={transition}
            onNext={() => workflow.closeSidebar()}
            workspaceSlug={workspaceSlug}
          />
        );
    }
  };

  return (
    <div className="flex h-full flex-col gap-5 px-5 py-4">
      <div className="flex justify-start items-center">
        <IconButton icon={ArrowRightIcon} variant="ghost" onClick={() => workflow.closeSidebar()} />
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          helper.selectedTab === "conditions" ? "overflow-hidden" : "overflow-y-auto vertical-scrollbar scrollbar-sm"
        )}
      >
        <div className={cn("mb-2 flex-1", helper.selectedTab === "conditions" && "min-h-0 flex flex-col")}>
          {renderSidebarContent()}
        </div>
      </div>
    </div>
  );
});
