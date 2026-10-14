/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";

// react hook form
import type { FieldError, Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { StateOutline } from "@makeplane/propel/icons";
import { ModuleStatusIcon } from "@plane/blocks/icons";
import type { TModuleStatus } from "@plane/blocks/icons";
import { Select } from "@plane/blocks/select";
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IModule } from "@plane/types";
import { cn } from "@plane/utils";

type ModuleStatusOption = (typeof MODULE_STATUS)[number];

type Props = {
  control: Control<IModule, any>;
  error?: FieldError;
  tabIndex?: number;
};

export function ModuleStatusSelect({ control, error, tabIndex }: Props) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      rules={{ required: true }}
      name="status"
      render={({ field: { value, onChange } }) => {
        const selectedValue = MODULE_STATUS.find((s) => s.value === value) ?? null;
        return (
          <Select<ModuleStatusOption>
            getValues={() => MODULE_STATUS}
            value={selectedValue}
            onChange={(val) => onChange(val as TModuleStatus)}
            getOptionValue={(status) => status.value}
            getOptionLabel={(status) => t(status.i18n_label)}
            getOptionIcon={(status) => <ModuleStatusIcon status={status.value} />}
            showSearch={false}
            pinSelected={false}
          >
            <Select.Trigger
              variant="pill-md"
              className={cn(error && "text-danger-primary")}
              tabIndex={tabIndex}
              appendIcon={null}
              prependIcon={
                value ? (
                  <ModuleStatusIcon status={value} />
                ) : (
                  <StateOutline
                    aria-hidden="true"
                    className={cn("h-3 w-3", error ? "text-danger-primary" : "text-secondary")}
                  />
                )
              }
            >
              {selectedValue ? (
                t(selectedValue.i18n_label)
              ) : (
                <span className={error ? "text-danger-primary" : "text-secondary"}>Status</span>
              )}
            </Select.Trigger>
          </Select>
        );
      }}
    />
  );
}
