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

import { Controller } from "react-hook-form";
import type { Control, ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
// plane imports
import { Input } from "@plane/propel/input";
import { Switch } from "@plane/propel/switch";
import { Loader, TextArea } from "@plane/ui";

type TProviderFormField<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  placeholder: string;
  description: string;
  required: boolean;
  type?: "text" | "password" | "textarea" | "toggle";
  control: Control<T>;
  errorMessage?: string;
  isInitializing: boolean;
  customRender?: (field: ControllerRenderProps<T>) => React.ReactNode;
};

export function ProviderFormField<T extends FieldValues>(props: TProviderFormField<T>) {
  const { name, label, placeholder, description, required, type, control, errorMessage, isInitializing, customRender } =
    props;

  // Toggle fields use horizontal layout
  if (type === "toggle") {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-body-sm-medium text-primary">{label}</span>
          <span className="text-body-xs-regular text-placeholder">{description}</span>
        </div>
        <Controller
          name={name}
          control={control}
          render={({ field: formField }) => {
            if (isInitializing) {
              return (
                <Loader>
                  <Loader.Item height="20px" width="44px" />
                </Loader>
              );
            }
            if (customRender) {
              return <>{customRender(formField)}</>;
            }
            return <Switch value={formField.value} onChange={formField.onChange} />;
          }}
        />
      </div>
    );
  }

  // Regular fields use vertical layout
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-body-sm-medium text-primary">
        {label}
        {required && <span className="text-danger-secondary ml-1">*</span>}
      </label>
      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `${label} is required` : false,
          pattern: String(name).includes("url")
            ? {
                value: /^https?:\/\/.+/,
                message: "Must be a valid URL",
              }
            : undefined,
        }}
        render={({ field: formField }) => {
          if (isInitializing) {
            return (
              <Loader>
                <Loader.Item height={type === "textarea" ? "102px" : "34px"} width="100%" />
              </Loader>
            );
          }
          if (customRender) {
            return <>{customRender(formField)}</>;
          }
          if (type === "textarea") {
            return (
              <TextArea
                {...formField}
                id={name}
                placeholder={placeholder}
                hasError={!!errorMessage}
                className="min-h-[102px] w-full"
                textAreaSize="sm"
              />
            );
          }
          return (
            <Input {...formField} id={name} type={type || "text"} placeholder={placeholder} hasError={!!errorMessage} />
          );
        }}
      />
      {errorMessage && <p className="text-body-xs-medium text-danger-secondary">{errorMessage}</p>}
      <p className="text-body-xs-regular text-placeholder">{description}</p>
    </div>
  );
}
