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
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { ChevronDownIcon, Plus, Trash, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import type { RunnerScriptFormData, RunnerScript } from "@plane/types";
import { useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { Input } from "@plane/ui";
import { cn } from "@plane/propel/utils";
import { isEmpty } from "lodash-es";

// API → Form
export const scriptToFormData = (script: RunnerScript): RunnerScriptFormData => ({
  ...script,
  env_variables: !isEmpty(script.env_variables)
    ? Object.entries(script.env_variables).map(([key, value]) => ({
        key,
        value,
      }))
    : [
        {
          key: "",
          value: "",
        },
      ],
  variables: script.variables || [],
});

// Form → API
export const formDataToScriptPayload = (formData: RunnerScriptFormData): Partial<RunnerScript> => ({
  ...formData,
  name: formData.name || "Untitled",
  env_variables: formData.env_variables.reduce<Record<string, string>>((acc, { key, value }) => {
    if (key) acc[key] = value;
    return acc;
  }, {}),
  variables: formData.variables?.map((v) => ({ key: v.key, required: v.required || false })),
});

export function EnvVariablesField() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    control,
    formState: { errors },
  } = useFormContext<RunnerScriptFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "env_variables",
  });

  return (
    <Collapsible
      className="flex flex-shrink-0 flex-col bg-layer-1 rounded-lg border border-subtle overflow-x-hidden"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CollapsibleTrigger className="sticky top-0 z-[2] w-full flex-shrink-0 bg-layer-2 cursor-pointer px-4 py-3 rounded-lg flex items-center justify-between">
        <div className="space-y-1 items-start">
          <div className="text-body-sm-medium text-primary font-medium text-start">Environment Variables</div>
          <div className="text-caption-md-regular text-tertiary text-start">
            JSON object of environment variables available in runner
          </div>
        </div>
        <ChevronDownIcon
          className={cn("size-4 text-icon-secondary transition-transform duration-200", {
            "rotate-180": isOpen,
          })}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4">
        <div className="space-y-3 bg-layer-2 rounded-lg  p-2">
          {fields.length > 0 && (
            <div className="flex gap-2 items-start mb-1 text-body-xs-medium text-primary">
              <div className="flex-1">Key</div>
              <div className="flex-1">Value</div>
              <IconButton className="opacity-0" variant={"ghost"} icon={Trash} />
            </div>
          )}
          {fields.map((field, index) => (
            <div key={field.id}>
              <div className="flex gap-2 items-center mb-1">
                <Controller
                  name={`env_variables.${index}.key`}
                  control={control}
                  rules={{ required: "Key is required" }}
                  render={({ field }) => (
                    <Input
                      placeholder="Key"
                      className="flex-1 text-body-sm-regular text-primary bg-layer-2 border border-subtle-1 rounded-lg"
                      {...field}
                    />
                  )}
                />

                <Controller
                  name={`env_variables.${index}.value`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="Value"
                      className="flex-1 text-body-sm-regular text-primary bg-layer-2 border border-subtle-1 rounded-lg"
                      {...field}
                    />
                  )}
                />

                <IconButton
                  variant={"ghost"}
                  icon={Trash2}
                  onClick={() => remove(index)}
                  className="text-icon-secondary"
                />
              </div>
              {errors.env_variables?.[index]?.key && (
                <p className="text-danger-primary text-11">{errors.env_variables?.[index]?.key?.message}</p>
              )}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => append({ key: "", value: "" })}>
            <Plus className="size-3" />
            Add more
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
