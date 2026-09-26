/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// react
import React from "react";
// react-hook-form
import type { Control, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { StateOutline } from "@makeplane/propel/icons";
import type { IModule } from "@plane/types";
// ui
import { Select } from "@plane/blocks/select";
// types
// common
// constants

type ModuleStatusOption = (typeof MODULE_STATUS)[number];

type Props = {
  control: Control<Partial<IModule>, any>;
  submitChanges: (formData: Partial<IModule>) => void;
  watch: UseFormWatch<Partial<IModule>>;
};

export function SidebarStatusSelect({ control, submitChanges, watch }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-13 sm:basis-1/2">
        <StateOutline className="h-4 w-4 flex-shrink-0" />
        <p>Status</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="status"
          render={({ field: { value } }) => (
            <Select<ModuleStatusOption>
              getValues={() => MODULE_STATUS}
              value={MODULE_STATUS.find((option) => option.value === value) ?? null}
              onChange={(val) => {
                submitChanges({ status: val as IModule["status"] });
              }}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => t(option.i18n_label)}
              getOptionIcon={(option) => (
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
              )}
              showSearch={false}
              pinSelected={false}
            >
              <Select.Trigger variant="select-md">
                <span className={`flex items-center gap-2 text-left capitalize ${value ? "" : "text-primary"}`}>
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: MODULE_STATUS?.find((option) => option.value === value)?.color,
                    }}
                  />
                  {watch("status")}
                </span>
              </Select.Trigger>
            </Select>
          )}
        />
      </div>
    </div>
  );
}
