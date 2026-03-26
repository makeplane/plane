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
import { Zap } from "lucide-react";
import { StateFlowPropertyButton } from "./property-button";
import { observer } from "mobx-react";
import { PropertyDisplay } from "./property-display";
import type { IWorkflowTransition } from "@plane/types";
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
import { useRunners } from "@/plane-web/hooks/store";
type Props = {
  workspaceSlug: string;
  transition: IWorkflowTransition;
  isInteractive: boolean;
  activeTab: string | null;
  handleOpenSidebar: (tab: "flow_type" | "states" | "members" | "conditions") => void;
};
export const ScriptButton = observer(function ScriptButton(props: Props) {
  const { workspaceSlug, transition, isInteractive, activeTab, handleOpenSidebar } = props;
  //hooks
  const { isRunnerAvailable } = useRunners();
  // derived values
  const runnerHealthy = isRunnerAvailable(workspaceSlug);
  // Renders script/conditions selection.
  const renderScript = () => {
    const totalScriptCount = transition.totalScriptCount;
    const valueContent = totalScriptCount ? (
      <span className="text-body-sm-regular truncate">
        {totalScriptCount} {totalScriptCount > 1 ? "conditions" : "condition"}
      </span>
    ) : (
      <span className="text-body-sm-regular text-placeholder">Conditions</span>
    );
    return isInteractive ? (
      <StateFlowPropertyButton
        icon={<Zap className="size-4" />}
        label="with"
        placeholder="Conditions"
        onClick={() => handleOpenSidebar("conditions")}
        isActiveTab={activeTab === "conditions"}
        value={<span className="text-body-sm-regular truncate">{valueContent ?? "Conditions"}</span>}
      />
    ) : (
      <PropertyDisplay label="with" icon={<Zap className="size-4" />}>
        {valueContent}
      </PropertyDisplay>
    );
  };
  if (!runnerHealthy) {
    return <></>;
  }
  return (
    <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={<></>} workspaceSlug={workspaceSlug}>
      <WithFeatureFlagHOC flag="WORKFLOW_CONDITIONS" fallback={<></>} workspaceSlug={workspaceSlug}>
        {renderScript()}
      </WithFeatureFlagHOC>
    </WithFeatureFlagHOC>
  );
});
