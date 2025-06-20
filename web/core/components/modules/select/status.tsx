"use client";

import React from "react";

// react hook form
import { Controller, FieldError, Control } from "react-hook-form";
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IModule } from "@plane/types";
// ui
import { CustomSelect, DoubleCircleIcon, ModuleStatusIcon } from "@plane/ui";
// types
// constants

type Props = {
  control: Control<IModule, any>;
  error?: FieldError;
  tabIndex?: number;
};

export const ModuleStatusSelect: React.FC<Props> = ({ control, error, tabIndex }) => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      rules={{ required: true }}
      name="status"
      render={({ field: { value, onChange } }) => {
        const selectedValue = MODULE_STATUS.find((s) => s.value === value);
        return (
          <CustomSelect
            value={value}
            label={
              <div className={`flex items-center justify-center gap-2 text-xs py-0.5 ${error ? "text-red-500" : ""}`}>
                {value ? (
                  <ModuleStatusIcon status={value} />
                ) : (
                  <DoubleCircleIcon className={`h-3 w-3 ${error ? "text-red-500" : "text-custom-text-200"}`} />
                )}
                {(selectedValue && t(selectedValue?.i18n_label)) ?? (
                  <span className={`${error ? "text-red-500" : "text-custom-text-200"}`}>Status</span>
                )}
              </div>
            }
            onChange={onChange}
            tabIndex={tabIndex}
            noChevron
          >
            {MODULE_STATUS.map((status) => (
              <CustomSelect.Option key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  <ModuleStatusIcon status={status.value} />
                  {t(status.i18n_label)}
                </div>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        );
      }}
    />
  );
};
