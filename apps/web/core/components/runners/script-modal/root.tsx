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
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useRunners } from "@/hooks/store/runners/use-runners";
import useSWR from "swr";
import { useParams } from "react-router";
import { ScriptModalSidebar } from "./sidebar";
import { CreateUpdateRunnerScript } from "../form/create-update-runner-script";
import { Button } from "@plane/propel/button";
import type { ERunnerScriptType, RunnerScript } from "@plane/types";
import { observer } from "mobx-react";
import { useState } from "react";

export const ScriptModal = observer(function ScriptModal(props: {
  isOpen: boolean;
  defaultScriptId: string | null | undefined;
  scriptType?: ERunnerScriptType;
  handleClose: () => void;
  handleUseSelectedScript: (scriptId: string | null) => void;
}) {
  const { isOpen, handleClose, defaultScriptId, scriptType, handleUseSelectedScript } = props;
  // plane hooks
  const { isLoading, getFilteredScriptsByWorkspaceSlug, fetchScriptById, getScriptById } = useRunners();
  const { workspaceSlug } = useParams();
  // states
  const [scriptId, setScriptId] = useState<string | null>(defaultScriptId ?? null);
  // derived values
  const scripts = workspaceSlug ? getFilteredScriptsByWorkspaceSlug(workspaceSlug, scriptType) : undefined;
  const script = scriptId && workspaceSlug ? getScriptById(scriptId) : undefined;

  useSWR<RunnerScript>(
    workspaceSlug && scriptId ? `RUNNER_SCRIPT_DETAIL_${workspaceSlug}_${scriptId}` : null,
    workspaceSlug && scriptId ? () => fetchScriptById(workspaceSlug, scriptId) : null
  );

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.VIXL}
      className="max-h-[650px] overflow-scroll"
    >
      <div className="grid grid-cols-4 divide-x divide-subtle-1">
        <ScriptModalSidebar
          activeScriptId={scriptId}
          scripts={scripts}
          isLoading={isLoading}
          onClickItem={(scriptId) => setScriptId(scriptId)}
        />
        <div className="flex flex-col gap-5 p-5 col-span-3">
          <CreateUpdateRunnerScript
            key={scriptId}
            scriptData={script}
            headerAction={
              <Button
                variant="primary"
                onClick={() => {
                  handleUseSelectedScript(scriptId);
                  handleClose();
                }}
                disabled={!scriptId}
              >
                Use script
              </Button>
            }
            callBack={(scriptId) => setScriptId(scriptId)}
            handleCancel={() => handleClose()}
            scriptType={scriptType}
          />
        </div>
      </div>
    </ModalCore>
  );
});
