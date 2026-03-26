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

import { PlusIcon } from "@plane/propel/icons";
import { ERunnerScriptType } from "@plane/types";
import type { TWorkflowScriptConfig } from "@plane/types";
import type { GetScriptById } from "./script-item";
import { ScriptItem } from "./script-item";
import { Button } from "@plane/propel/button";
import { ScriptModal } from "@/components/runners/script-modal/root";

type Props = {
  label: string;
  description: string;
  scripts: TWorkflowScriptConfig[];
  openModalIndex: number | null;
  onScriptsChange: (scripts: TWorkflowScriptConfig[]) => void;
  getScriptById: GetScriptById;
  onOpenModal: (index: number) => void;
  onCloseModal: () => void;
};

export function ScriptSection({
  label,
  description,
  scripts,
  openModalIndex,
  onScriptsChange,
  getScriptById,
  onOpenModal,
  onCloseModal,
}: Props) {
  const updateScript = (index: number, updates: Partial<TWorkflowScriptConfig>) => {
    const next = [...scripts];
    next[index] = { ...next[index], ...updates };
    onScriptsChange(next);
  };

  const removeScript = (index: number) => {
    onScriptsChange(scripts.filter((_, i) => i !== index));
  };

  const addScript = () => {
    onScriptsChange([...scripts, { script_id: "", execution_variables: {} }]);
    onOpenModal(scripts.length);
  };

  const editingScript = openModalIndex !== null && openModalIndex < scripts.length ? scripts[openModalIndex] : null;

  return (
    <div className="space-y-3 py-5">
      <div className="flex flex-col gap-1">
        <p className="text-body-sm-medium text-primary">{label}</p>
        <p className="text-body-xs-regular text-tertiary">{description}</p>
      </div>
      <div className="flex flex-col gap-3">
        {scripts.map((scriptConfig, index) => (
          <ScriptItem
            key={index}
            index={index}
            scriptConfig={scriptConfig}
            onVariableChange={(k, value) => {
              updateScript(index, {
                execution_variables: {
                  ...(scriptConfig.execution_variables ?? {}),
                  [k]: value,
                },
              });
            }}
            onRemove={() => removeScript(index)}
            getScriptById={getScriptById}
            onOpenModal={() => onOpenModal(index)}
          />
        ))}
        <Button variant="tertiary" className="w-fit" onClick={addScript}>
          <PlusIcon className="size-4" />
          Add more
        </Button>
      </div>
      {editingScript && openModalIndex !== null && (
        <ScriptModal
          key={openModalIndex}
          isOpen={true}
          handleClose={onCloseModal}
          defaultScriptId={editingScript.script_id}
          handleUseSelectedScript={(scriptId) => {
            updateScript(openModalIndex, {
              script_id: scriptId ?? "",
              execution_variables: {},
            });
            onCloseModal();
          }}
          scriptType={ERunnerScriptType.WORKFLOW_TRANSITION}
        />
      )}
    </div>
  );
}
