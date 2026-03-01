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
import { Button } from "@plane/propel/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { cn } from "@plane/propel/utils";
import { TextArea, Input } from "@plane/ui";
import { Clock, ChevronDownIcon, TriangleAlert, Check } from "lucide-react";
import { useState } from "react";
import { runnerCtlService } from "@/services/runners/runnerctl.service";
import type { RunnerScriptFormData, TRunnerScriptExecution } from "@plane/types";
import { formDataToScriptPayload } from "./env-variables-field";

const StatusBadge = ({ status }: { status: string | undefined }) => {
  switch (status) {
    case "in_progress":
      return (
        <div className="bg-warning-subtle rounded-md p-1 flex items-center gap-1 ">
          <Clock className="h-3 w-3 text-warning-primary" />
          <span className="text-warning-primary text-caption-sm-medium">Running...</span>
        </div>
      );
    case "completed":
      return (
        <div className="bg-success-subtle-1 rounded-md p-1 flex items-center gap-1 ">
          <Check className="h-3 w-3 text-icon-success-primary" />
          <span className="text-success-primary text-caption-sm-medium">Success</span>
        </div>
      );
    case "errored":
      return (
        <div className="bg-danger-subtle rounded-md p-1 flex items-center gap-1 ">
          <TriangleAlert className="h-3 w-3 text-icon-danger-primary" />
          <span className="text-danger-primary text-caption-sm-medium">Error</span>
        </div>
      );
    default:
      return <></>;
  }
};

type Props = {
  workspaceSlug: string;
  config: RunnerScriptFormData;
};

export const TestScript = (props: Props) => {
  const { workspaceSlug, config } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [inputData, setInputData] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execution, setExecution] = useState<TRunnerScriptExecution | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Get saved variables from config
  const savedVariables = config.variables?.filter((v) => v.key) || [];

  const handleVariableChange = (key: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }));
  };

  const validateJson = (value: string): boolean => {
    if (!value.trim()) {
      setJsonError(null);
      return true;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
      return true;
    } catch {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const handleInputChange = (value: string) => {
    setInputData(value);
    if (value.trim()) {
      validateJson(value);
    } else {
      setJsonError(null);
    }
  };

  const handleExecute = async () => {
    if (!validateJson(inputData)) {
      return;
    }
    try {
      setIsExecuting(true);
      setApiError(null);
      const parsedInput: unknown = inputData.trim() ? JSON.parse(inputData) : {};
      const formattedConfig = formDataToScriptPayload(config);
      const result = await runnerCtlService.testScript(workspaceSlug, formattedConfig, parsedInput, variableValues);
      setExecution(result);
    } catch (error) {
      console.error("Failed to execute script:", error);
      setExecution(null);
      // Extract error message from API response
      const errorMessage = (error as { error?: string })?.error || "Failed to execute script";
      setApiError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Collapsible
      className="flex flex-shrink-0 flex-col bg-layer-1 rounded-lg border border-subtle overflow-x-hidden"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CollapsibleTrigger className="sticky top-0 z-[2] w-full flex-shrink-0 bg-layer-2 cursor-pointer px-4 py-3 rounded-lg flex items-center justify-between">
        <div className="space-y-1 items-start">
          <div className="flex items-center gap-2">
            <span className="text-body-sm-medium text-primary font-medium text-start">Test</span>
            {isExecuting && <StatusBadge status={"in_progress"} />}
          </div>
          <div className="text-caption-md-regular text-tertiary">Validate your script </div>
        </div>
        <ChevronDownIcon
          className={cn("size-4 text-icon-secondary transition-transform duration-200", {
            "rotate-180": isOpen,
          })}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4">
        <div className="space-y-2">
          <div className="text-body-sm-medium text-primary font-medium text-start">Input Data (JSON)</div>
          <TextArea
            value={inputData}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder='{"key": "value"}'
            className="w-full min-h-[90px] text-body-sm-regular bg-surface-1 rounded-lg border border-subtle-1"
          />
          {jsonError && <p className="text-danger-primary text-caption-md-regular">{jsonError}</p>}
          {savedVariables.length > 0 && (
            <div className="space-y-2">
              <div className="text-body-sm-medium text-primary font-medium text-start">Variables</div>
              {savedVariables.map((variable) => (
                <div key={variable.key} className="space-y-1">
                  <label className="text-body-xs-medium text-primary">
                    {variable.key}
                    {variable.required && <span className="text-danger-primary">*</span>}
                  </label>
                  <Input
                    value={variableValues[variable.key] || ""}
                    onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                    placeholder="Add value"
                    className="w-full text-body-sm-regular bg-surface-1 rounded-lg border border-subtle-1"
                  />
                </div>
              ))}
            </div>
          )}
          {apiError && (
            <div className="flex items-center gap-2">
              <span className="text-body-sm-medium text-primary font-medium text-start">Output</span>
              <StatusBadge status="errored" />
            </div>
          )}
          {apiError && (
            <div className="px-3 py-2 w-full min-h-[90px] text-body-sm-regular bg-surface-1 rounded-lg border border-subtle-1 text-danger-primary">
              {apiError}
            </div>
          )}
          {execution && (
            <div className="flex items-center gap-2">
              <span className="text-body-sm-medium text-primary font-medium text-start">Output</span>
              {execution?.status && <StatusBadge status={execution?.status} />}
            </div>
          )}
          {execution && (
            <div className="px-3 py-2 w-full min-h-[90px] text-body-sm-regular bg-surface-1 rounded-lg border border-subtle-1">
              {String(
                JSON.stringify(
                  execution.status === "errored" ? execution?.error_data?.message : execution.output_data,
                  null,
                  2
                )
              )}
            </div>
          )}
          <Button type="button" variant="primary" onClick={() => void handleExecute()}>
            Test
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
