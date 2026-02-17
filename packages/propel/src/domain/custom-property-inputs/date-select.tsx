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

import React, { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { EIssuePropertyType, TIssueProperty } from "@plane/types";
import { Calendar } from "../../calendar";
import { Popover } from "../../popover";
import { cn } from "../../utils";

type TDateSelectProps = {
  property: TIssueProperty<EIssuePropertyType.DATETIME>;
  isPreview?: boolean;
  required?: boolean;
};

export function DateSelect({ property, isPreview = false, required = false }: TDateSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const [isOpen, setIsOpen] = useState(false);
  const fieldName = `property_${property.id}`;
  const error = errors[fieldName];

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="w-full space-y-1">
      <label htmlFor={fieldName} className="text-13 font-medium text-tertiary">
        {property.display_name}
        {(required || property.is_required) && <span className="ml-0.5 text-danger-primary">*</span>}
      </label>
      <Controller
        control={control}
        name={fieldName}
        rules={{
          required: (required || property.is_required) && `${property.display_name} is required`,
        }}
        render={({ field: { value, onChange } }) => (
          <Popover open={isOpen && !isPreview} onOpenChange={setIsOpen}>
            <Popover.Trigger
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-3 py-2 text-13 focus:outline-none",
                {
                  "border-subtle-1": !error,
                  "border-danger-strong": error,
                  "cursor-not-allowed opacity-60": isPreview,
                }
              )}
              disabled={isPreview}
            >
              <span
                className={cn("text-secondary", {
                  "text-placeholder": !value,
                })}
              >
                {value ? formatDate(value) : `Select ${property.display_name?.toLowerCase() || "date"}`}
              </span>
            </Popover.Trigger>
            <Popover.Content
              className="rounded-md border border-subtle-1 bg-surface-1 shadow-lg"
              side="bottom"
              align="start"
              sideOffset={8}
              positionerClassName="z-30"
            >
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  if (date) {
                    onChange(date.toISOString().split("T")[0]);
                    setIsOpen(false);
                  }
                }}
                disabled={isPreview}
              />
            </Popover.Content>
          </Popover>
        )}
      />
      {error && <span className="text-11 text-danger-primary">{error.message as string}</span>}
    </div>
  );
}
