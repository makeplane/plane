import React from "react";

// react hook form
import type { FieldError, Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { StatePropertyIcon, ModuleStatusIcon } from "@plane/propel/icons";
import type { IModule } from "@plane/types";
// ui
import { CustomSelect } from "@plane/ui";
// types
// constants

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
        const selectedValue = MODULE_STATUS.find((s) => s.value === value);
        return (
          <CustomSelect
            value={value}
            label={
              <div
                className={`flex items-center justify-center gap-2 text-11 py-0.5 ${error ? "text-danger-primary" : ""}`}
              >
                {value ? (
                  <ModuleStatusIcon status={value} />
                ) : (
                  <StatePropertyIcon className={`h-3 w-3 ${error ? "text-danger-primary" : "text-secondary"}`} />
                )}
                {(selectedValue && t(selectedValue?.i18n_label)) ?? (
                  <span className={`${error ? "text-danger-primary" : "text-secondary"}`}>Status</span>
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
}
