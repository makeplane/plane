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
import { Plus, Trash, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { Input } from "@plane/ui";
import type { TConnectorFormData } from "@plane/types";

export function HeaderField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<TConnectorFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "headers",
  });

  return (
    <div className="bg-layer-2 flex flex-col gap-1 rounded-lg">
      {fields.length > 0 && (
        <div className="flex gap-2 items-start text-body-xs-medium text-primary">
          <div className="flex-1">Name</div>
          <div className="flex-1">Value</div>
          <IconButton className="opacity-0" variant={"ghost"} icon={Trash} />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <div key={field.id}>
            <div className="flex gap-2 items-center mb-1">
              <Controller
                name={`headers.${index}.name`}
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <Input
                    placeholder="Name"
                    className="flex-1 text-body-sm-regular text-primary bg-layer-2 border border-subtle-1 rounded-lg"
                    {...field}
                  />
                )}
              />

              <Controller
                name={`headers.${index}.value`}
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
            {errors.headers?.[index]?.name && (
              <p className="text-danger-primary text-11">
                {String((errors.headers[index] as { name?: { message?: string } })?.name?.message ?? "")}
              </p>
            )}
          </div>
        ))}
        <Button type="button" variant="secondary" className="w-fit" onClick={() => append({ name: "", value: "" })}>
          <Plus className="size-3" />
          Add more
        </Button>
      </div>
    </div>
  );
}
