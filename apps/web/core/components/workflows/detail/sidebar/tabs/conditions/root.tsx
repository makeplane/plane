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

import { useRunners } from "@/hooks/store/runners/use-runners";
import { observer } from "mobx-react";
import { useState, useCallback } from "react";
import type { IWorkflowState, IWorkflowTransition, TWorkflowRule, TWorkflowScriptConfig } from "@plane/types";
import { Button } from "@plane/propel/button";
import { ChevronRightIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { ScriptSection } from "./script-section";
import { hasMissingRequiredVariables } from "./utils";
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";

type Props = {
  state: IWorkflowState;
  transition: IWorkflowTransition;
  workspaceSlug: string;
  onNext: () => void;
};

type ScriptType = "pre_validation" | "post_action";

export const ConditionsTabContent = observer(function ConditionsTabContent(props: Props) {
  const { transition, onNext, workspaceSlug } = props;
  // state
  const [openModal, setOpenModal] = useState<{ type: ScriptType; index: number } | null>(null);
  //hooks
  const { getScriptById, isRunnerAvailable } = useRunners();
  // derived values
  const runnerHealthy = isRunnerAvailable(workspaceSlug);

  // Extract script configs from run_script rules for the ScriptSection UI
  const preValidationScripts = (transition.pre_rules ?? [])
    .filter((r) => r.handler_name === "run_script")
    .map((r) => r.config as TWorkflowScriptConfig);
  const postActionScripts = (transition.post_rules ?? [])
    .filter((r) => r.handler_name === "run_script")
    .map((r) => r.config as TWorkflowScriptConfig);

  // Convert TWorkflowScriptConfig[] back to TWorkflowRule[] when saving
  const toPreRules = (scripts: TWorkflowScriptConfig[]): TWorkflowRule[] =>
    scripts.map((s) => ({ handler_name: "run_script", rule_type: "validation", config: s }));
  const toPostRules = (scripts: TWorkflowScriptConfig[]): TWorkflowRule[] =>
    scripts.map((s) => ({ handler_name: "run_script", rule_type: "action", config: s }));

  const handleDone = useCallback(() => {
    const allScripts = [
      ...preValidationScripts.filter((s: TWorkflowScriptConfig) => s.script_id),
      ...postActionScripts.filter((s: TWorkflowScriptConfig) => s.script_id),
    ];
    if (hasMissingRequiredVariables(allScripts, getScriptById)) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Missing required variables",
        message: "Please fill in all required variables for each script before continuing.",
      });
      return;
    }
    onNext();
  }, [preValidationScripts, postActionScripts, getScriptById, onNext]);

  const handlePreValidationScriptsChange = (scripts: TWorkflowScriptConfig[]) => {
    transition.mutate({ pre_rules: toPreRules(scripts) });
  };

  const handlePostActionScriptsChange = (scripts: TWorkflowScriptConfig[]) => {
    transition.mutate({ post_rules: toPostRules(scripts) });
  };

  if (!runnerHealthy) {
    return <></>;
  }

  return (
    <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={<></>} workspaceSlug={workspaceSlug}>
      <WithFeatureFlagHOC flag="WORKFLOW_CONDITIONS" fallback={<></>} workspaceSlug={workspaceSlug}>
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
          <p className="text-h6-medium shrink-0">Conditions</p>
          <div className="h-0 min-h-0 flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm">
            <div className="flex flex-col divide-y divide-subtle-1">
              <ScriptSection
                label="Pre validation"
                description="Verifying readiness before work moves."
                scripts={
                  preValidationScripts.length > 0 ? preValidationScripts : [{ script_id: "", execution_variables: {} }]
                }
                onScriptsChange={handlePreValidationScriptsChange}
                getScriptById={getScriptById}
                openModalIndex={openModal?.type === "pre_validation" ? openModal.index : null}
                onOpenModal={(index) => setOpenModal({ type: "pre_validation", index })}
                onCloseModal={() => setOpenModal(null)}
              />
              <ScriptSection
                label="Post actions"
                description="What happens immediately after a move."
                scripts={
                  postActionScripts.length > 0 ? postActionScripts : [{ script_id: "", execution_variables: {} }]
                }
                onScriptsChange={handlePostActionScriptsChange}
                getScriptById={getScriptById}
                openModalIndex={openModal?.type === "post_action" ? openModal.index : null}
                onOpenModal={(index) => setOpenModal({ type: "post_action", index })}
                onCloseModal={() => setOpenModal(null)}
              />
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-2">
            <Button variant="tertiary" className="w-fit" onClick={() => onNext()}>
              Skip
            </Button>
            <Button variant="primary" onClick={handleDone} appendIcon={<ChevronRightIcon className="size-4" />}>
              Done
            </Button>
          </div>
        </div>
      </WithFeatureFlagHOC>
    </WithFeatureFlagHOC>
  );
});
