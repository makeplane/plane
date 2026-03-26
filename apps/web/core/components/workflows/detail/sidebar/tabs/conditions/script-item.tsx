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

import { Input } from "@plane/ui";
import { ChevronDownIcon } from "@plane/propel/icons";
import { FileCode, Plus, Trash2 } from "lucide-react";
import type { TWorkflowScriptConfig } from "@plane/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { cn } from "@plane/propel/utils";

export type GetScriptById = (
  id: string
) => { name: string; variables?: { key: string; required?: boolean }[] | null } | undefined;

type Props = {
  index: number;
  scriptConfig: TWorkflowScriptConfig;
  onVariableChange: (key: string, value: string) => void;
  onRemove: () => void;
  getScriptById: GetScriptById;
  onOpenModal: () => void;
};

export function ScriptItem({ index, scriptConfig, onVariableChange, onRemove, getScriptById, onOpenModal }: Props) {
  const script = scriptConfig.script_id ? getScriptById(scriptConfig.script_id) : undefined;
  const executionVariables = scriptConfig.execution_variables ?? {};
  const scriptVariables = script?.variables ?? [];

  return (
    <Collapsible defaultOpen className="flex flex-col rounded-lg overflow-hidden bg-layer-1">
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="group flex-1 flex items-center justify-between px-3 py-2 text-body-sm-regular transition-colors">
          <span className="text-body-xs-medium text-secondary">#{index + 1}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="rounded-md hover:bg-layer-2 text-icon-tertiary hover:text-danger-primary transition-colors"
              aria-label="Remove script"
            >
              <Trash2 className="size-4" />
            </button>
            <ChevronDownIcon className="size-4 text-icon-tertiary transition-transform duration-200 group-data-panel-open:rotate-180" />
          </div>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="duration-100 transition-[height]">
        <div className="p-3 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-body-xs-medium text-secondary">Run script</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "flex-1 flex items-center gap-1 text-body-sm-regular h-8 bg-layer-2 border border-subtle rounded-md px-2",
                  { "text-placeholder": !script }
                )}
                onClick={onOpenModal}
              >
                {script ? (
                  <FileCode className="size-4 text-icon-secondary" />
                ) : (
                  <Plus className="size-4 text-icon-tertiary" />
                )}
                {script ? script.name : "Select script"}
              </button>
            </div>
          </div>
          {scriptVariables.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-body-xs-medium text-secondary">Variables</div>
              {scriptVariables.map((variable) => (
                <div key={variable.key} className="space-y-1">
                  <div className="text-body-xs-regular text-secondary">
                    {variable.key}
                    {variable.required && <span className="text-danger-primary">*</span>}
                  </div>
                  <Input
                    value={executionVariables[variable.key] ?? ""}
                    onChange={(e) => onVariableChange(variable.key, e.target.value)}
                    placeholder="Value"
                    className="w-full h-7 text-body-xs-regular text-primary bg-layer-2 border border-subtle-1 rounded-md px-2 py-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
