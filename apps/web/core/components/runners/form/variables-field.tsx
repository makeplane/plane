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
import type { RunnerScriptFormData } from "@plane/types";
import { useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { Checkbox, Input } from "@plane/ui";
import { cn } from "@plane/propel/utils";

export function VariablesField({ readOnly = false }: { readOnly?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    control,
    formState: { errors },
  } = useFormContext<RunnerScriptFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variables",
  });

  return (
    <Collapsible
      className="flex flex-shrink-0 flex-col bg-layer-1 rounded-lg border border-subtle overflow-x-hidden"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CollapsibleTrigger className="sticky top-0 z-[2] w-full flex-shrink-0 bg-layer-2 cursor-pointer px-4 py-3 rounded-lg flex items-center justify-between">
        <div className="space-y-1 items-start">
          <div className="flex items-center gap-2">
            <div className="text-body-sm-medium text-primary font-medium text-start">Variables</div>
            {fields.length > 0 && (
              <span className="text-accent-primary bg-accent-subtle-hover text-caption-sm-medium px-1.5 py-0.5 rounded-md">
                {fields.length}
              </span>
            )}
          </div>
          <div className="text-caption-md-regular text-tertiary text-start">
            You will be prompted to provide variable values when configuring an automation rule using this script.
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
            <div className="flex justify-between items-start mb-1 text-body-xs-medium text-tertiary">
              <div className="w-[80%]">Key</div>
              <div className="flex gap-2 items-center">
                <div className="w-20 m-auto flex justify-center">Required</div>
                <IconButton className="opacity-0" variant={"ghost"} icon={Trash} />
              </div>
            </div>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="flex justify-between">
              <Controller
                name={`variables.${index}.key`}
                control={control}
                rules={{ required: "Key is required" }}
                render={({ field }) => (
                  <Input
                    readOnly={readOnly}
                    placeholder="Key"
                    className={cn(
                      "w-[80%] text-body-sm-regular text-primary bg-layer-2 border border-subtle-1 rounded-lg",
                      {
                        "text-tertiary": readOnly,
                      }
                    )}
                    {...field}
                  />
                )}
              />
              <div className="flex gap-2 items-center">
                <Controller
                  name={`variables.${index}.required`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={Boolean(field.value) || false}
                      containerClassName="w-fit w-20 m-auto flex justify-center border-r border-subtle-1 rounded-none focus-none outline-none"
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={readOnly}
                    />
                  )}
                />
                <IconButton
                  variant={"ghost"}
                  icon={Trash2}
                  onClick={() => remove(index)}
                  className="text-icon-secondary"
                  disabled={readOnly}
                />
              </div>
              {errors.env_variables?.[index]?.key && (
                <p className="text-danger-primary text-11">{errors.env_variables?.[index]?.key?.message}</p>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="secondary" onClick={() => append({ key: "", required: true })}>
              <Plus className="size-3" />
              Add more
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
