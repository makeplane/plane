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

import { Controller, useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { DEFAULT_PROJECT_IDENTIFIER_MAX_LENGTH } from "@plane/constants";
import type { IFormattedInstanceConfiguration, TInstanceConfigKeys } from "@plane/types";
import { Input } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store";

type ConfigurationsFormProps = {
  config: IFormattedInstanceConfiguration;
};

type ConfigurationsFormValues = Record<TInstanceConfigKeys, string>;

export function ConfigurationsForm(props: ConfigurationsFormProps) {
  const { config } = props;
  // store hooks
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ConfigurationsFormValues>({
    defaultValues: {
      PROJECT_IDENTIFIER_MAX_LENGTH:
        config["PROJECT_IDENTIFIER_MAX_LENGTH"] || String(DEFAULT_PROJECT_IDENTIFIER_MAX_LENGTH),
    },
  });

  const onSubmit = async (formData: ConfigurationsFormValues) => {
    const payload: Partial<ConfigurationsFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Configuration settings updated successfully.",
        })
      )
      .catch((err) => {
        console.error(err);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to update configuration settings.",
        });
      });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="text-16 font-medium text-primary">Project settings</div>
        <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-x-16 gap-y-8 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <h4 className="text-13 text-tertiary">Project identifier max length</h4>
            <Controller
              control={control}
              name="PROJECT_IDENTIFIER_MAX_LENGTH"
              rules={{
                required: "This field is required.",
                validate: (value) => {
                  const num = parseInt(value, 10);
                  if (isNaN(num)) return "Must be a number.";
                  if (num < 1) return "Minimum value is 1.";
                  if (num > 255) return "Maximum value is 255.";
                  return true;
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="PROJECT_IDENTIFIER_MAX_LENGTH"
                  name="PROJECT_IDENTIFIER_MAX_LENGTH"
                  type="number"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.PROJECT_IDENTIFIER_MAX_LENGTH)}
                  placeholder="10"
                  className="w-full rounded-md font-medium"
                  min={1}
                  max={255}
                />
              )}
            />
            {errors.PROJECT_IDENTIFIER_MAX_LENGTH && (
              <p className="text-11 text-danger-primary">{errors.PROJECT_IDENTIFIER_MAX_LENGTH.message}</p>
            )}
            <p className="pt-0.5 text-11 text-tertiary">
              Maximum number of characters allowed for project identifiers (1–255). Default is 10.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={isSubmitting}
        >
          {isSubmitting ? "Saving" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
