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

import { ScriptModal } from "@/components/runners/script-modal/root";
import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { TAutomationActionFormData } from "../../root";
import { useRunners } from "@/hooks/store/runners/use-runners";
import { Pencil } from "lucide-react";
import { Input } from "@plane/ui";
import type { TRunScriptActionConfig } from "@plane/types";

export const AutomationActionRunScriptConfiguration = observer(function AutomationActionRunScriptConfiguration(_props: {
  workspaceSlug: string;
}) {
  // hooks
  const { control, watch, setValue } = useFormContext<TAutomationActionFormData>();
  const { getScriptById } = useRunners();
  // states
  const [isOpen, setIsOpen] = useState(false);
  // derived values
  const config = watch("config") as TRunScriptActionConfig | undefined;
  const scriptId = config?.script_id;
  const executionVariables = config?.execution_variables || {};
  const script = scriptId ? getScriptById(scriptId) : undefined;
  const scriptVariables = script?.variables || [];

  // Initialize execution_variables when script changes
  useEffect(() => {
    if (script?.variables && script.variables.length > 0) {
      const initialVariables: Record<string, string> = {};
      script.variables.forEach((v) => {
        initialVariables[v.key] = executionVariables[v.key] || "";
      });
      setValue("config.execution_variables", initialVariables, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptId]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleVariableChange = (key: string, value: string) => {
    setValue("config.execution_variables", { ...executionVariables, [key]: value }, { shouldDirty: true });
  };

  return (
    <div className="space-y-2.5">
      <Controller
        control={control}
        name="config.script_id"
        render={({ field: { value, onChange } }) => (
          <ScriptModal
            isOpen={isOpen}
            handleClose={handleClose}
            defaultScriptId={value}
            handleUseSelectedScript={onChange}
          />
        )}
      />
      <button
        type="button"
        className="w-full px-4 py-1.5 rounded-md border-[0.5px] border-subtle-1 hover:bg-layer-transparent-hover flex items-center gap-2 cursor-pointer transition-colors text-start"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex w-full justify-between items-center gap-2">
          {script ? (
            <div className="text-primary text-[11px]">{script.name}</div>
          ) : (
            <div className="text-placeholder text-[11px]">Select Script</div>
          )}
          <Pencil className="size-3 text-icon-neutral-subtle" />
        </div>
      </button>

      {/* Variables */}
      {scriptVariables.length > 0 && (
        <div className="space-y-2">
          <p className="text-tertiary text-11 font-medium">Variables</p>
          {scriptVariables.map((variable) => (
            <div key={variable.key} className="space-y-1">
              <div className="text-[11px] text-tertiary">
                {variable.key}
                {variable.required && <span className="text-danger-primary">*</span>}
              </div>
              <Input
                value={executionVariables[variable.key] || ""}
                onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                placeholder="Value"
                className="w-full h-7 text-[11px] bg-surface-1 rounded-md border-[0.5px] border-subtle-1 px-2 py-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
