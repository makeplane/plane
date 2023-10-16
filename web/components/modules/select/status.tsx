import React from "react";

// react hook form
import { Controller, FieldError, Control } from "react-hook-form";
// ui
import { CustomSelect } from "components/ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { ModuleStatusIcon } from "@plane/ui";
// types
import type { IModule } from "types";
// constants
import { MODULE_STATUS } from "constants/module";

type Props = {
  control: Control<IModule, any>;
  error?: FieldError;
};

export const ModuleStatusSelect: React.FC<Props> = ({ control, error }) => (
  <Controller
    control={control}
    rules={{ required: true }}
    name="status"
    render={({ field: { value, onChange } }) => (
      <CustomSelect
        value={value}
        label={
          <div className={`flex items-center justify-center gap-2 text-xs ${error ? "text-red-500" : ""}`}>
            {value ? (
              <ModuleStatusIcon status={value} />
            ) : (
              <Squares2X2Icon className={`h-3 w-3 ${error ? "text-red-500" : "text-custom-text-200"}`} />
            )}
            {MODULE_STATUS.find((s) => s.value === value)?.label ?? (
              <span className={`${error ? "text-red-500" : "text-custom-text-200"}`}>Status</span>
            )}
          </div>
        }
        onChange={onChange}
        noChevron
      >
        {MODULE_STATUS.map((status) => (
          <CustomSelect.Option key={status.value} value={status.value}>
            <div className="flex items-center gap-2">
              <ModuleStatusIcon status={status.value} />
              {status.label}
            </div>
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    )}
  />
);
