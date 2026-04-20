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
// plane imports
import { Switch } from "@plane/propel/switch";
import { setPromiseToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceConfigKeys } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store";

type SecurityFormProps = { config: IFormattedInstanceConfiguration };

type SecurityFormValues = Record<TInstanceConfigKeys, string>;

export function SecurityForm(props: SecurityFormProps) {
  const { config } = props;
  // store hooks
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<SecurityFormValues>({
    defaultValues: {
      DISABLE_ACCESS_TOKENS: String(config["DISABLE_ACCESS_TOKENS"] || "0"),
    },
  });

  const updateConfig = (formData: SecurityFormValues) => {
    const payload: Partial<SecurityFormValues> = { ...formData };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving security settings",
      success: {
        title: "Success",
        message: () => "Security settings updated successfully.",
      },
      error: {
        title: "Error",
        message: () => "Failed to update security settings.",
      },
    });
  };

  return (
    <div className="flex items-center gap-14">
      <div className="grow">
        <div className="text-16 font-medium pb-1">Disable access tokens</div>
        <div className="font-regular text-tertiary text-11">
          When enabled, users cannot create new personal or workspace access tokens, and existing tokens will stop
          working. Service and integration tokens are not affected.
        </div>
      </div>
      <div className={`flex shrink-0 pr-4 ${isSubmitting && "opacity-70"}`}>
        <Controller
          control={control}
          name="DISABLE_ACCESS_TOKENS"
          render={({ field: { value, onChange } }) => (
            <Switch
              value={value === "1"}
              onChange={(next: boolean) => {
                onChange(next ? "1" : "0");
                void handleSubmit(updateConfig)();
              }}
              disabled={isSubmitting}
            />
          )}
        />
      </div>
    </div>
  );
}
