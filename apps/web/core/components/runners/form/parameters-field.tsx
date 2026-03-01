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
import { IconButton } from "@plane/propel/icon-button";
import type { FunctionParameter, ScriptFunctionFormData } from "@plane/types";
import { Checkbox, cn, Input } from "@plane/ui";
import { ChevronDownIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

type FormData = ScriptFunctionFormData & {
  parameters: (FunctionParameter & { id?: string })[];
};

export function ParametersField({ readOnly = false }: { readOnly?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { control } = useFormContext<FormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parameters",
  });

  return (
    <Collapsible
      className="flex flex-shrink-0 flex-col bg-layer-1 rounded-lg border border-subtle overflow-x-hidden"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CollapsibleTrigger className="sticky top-0 w-full flex-shrink-0 bg-layer-2 cursor-pointer px-4 py-3 rounded-lg flex items-center justify-between">
        <div className="space-y-1 items-start">
          <div className="flex items-center gap-2">
            <span className="text-body-sm-medium text-primary font-medium text-start">Parameters</span>
            {fields.length > 0 && (
              <span className="bg-layer-3 text-tertiary text-caption-sm-medium px-1.5 py-0.5 rounded">
                {fields.length}
              </span>
            )}
          </div>
          <div className="text-caption-md-regular text-tertiary text-start">
            Define the input parameters for your function
          </div>
        </div>
        <ChevronDownIcon
          className={cn("size-4 text-icon-secondary transition-transform duration-200", {
            "rotate-180": isOpen,
          })}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4">
        <div className="space-y-3">
          {fields.length > 0 && (
            <div className="grid grid-cols-12 gap-2 text-body-xs-medium text-primary mb-1">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-1">Required</div>
              <div className="col-span-1"></div>
            </div>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
              <Controller
                name={`parameters.${index}.name`}
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <Input
                    placeholder="Name"
                    className={cn(
                      "col-span-3 text-body-sm-regular bg-layer-2 border border-subtle-1 rounded-lg font-mono",
                      {
                        "text-tertiary": readOnly,
                      }
                    )}
                    {...field}
                    readOnly={readOnly}
                  />
                )}
              />
              <Controller
                name={`parameters.${index}.type`}
                control={control}
                rules={{ required: "Type is required" }}
                render={({ field }) => (
                  <Input
                    placeholder="string"
                    className={cn(
                      "col-span-3 text-body-sm-regular bg-layer-2 border border-subtle-1 rounded-lg font-mono",
                      {
                        "text-tertiary": readOnly,
                      }
                    )}
                    {...field}
                    readOnly={readOnly}
                  />
                )}
              />
              <Controller
                name={`parameters.${index}.description`}
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Description"
                    className={cn("col-span-4 text-body-sm-regular bg-layer-2 border border-subtle-1 rounded-lg", {
                      "text-tertiary": readOnly,
                    })}
                    {...field}
                    readOnly={readOnly}
                  />
                )}
              />
              <Controller
                name={`parameters.${index}.required`}
                control={control}
                render={({ field }) => (
                  <div className="col-span-1 flex justify-center">
                    <Checkbox
                      checked={Boolean(field.value) || false}
                      containerClassName="w-fit m-auto flex justify-center border-r border-subtle-1 rounded-none focus-none outline-none"
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={readOnly}
                    />
                  </div>
                )}
              />
              <div className="col-span-1 flex justify-center">
                <IconButton
                  variant={"ghost"}
                  icon={Trash2}
                  onClick={() => remove(index)}
                  className="text-icon-secondary"
                  disabled={readOnly}
                />
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ name: "", type: "string", description: "", required: true, defaultValue: "" })}
            >
              <Plus className="size-3" />
              Add parameter
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
