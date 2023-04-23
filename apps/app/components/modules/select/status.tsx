import React from "react";

// react hook form
import { Controller, FieldError, Control } from "react-hook-form";
// ui
import { CustomSelect } from "components/ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
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
          <div
            className={`flex items-center justify-center gap-2 text-xs ${
              error ? "text-red-500" : ""
            }`}
          >
            {value ? (
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: MODULE_STATUS.find((s) => s.value === value)?.color,
                }}
              />
            ) : (
              <Squares2X2Icon
                className={`h-3 w-3 ${error ? "text-red-500" : "text-brand-secondary"}`}
              />
            )}
            {MODULE_STATUS.find((s) => s.value === value)?.label ?? (
              <span className="text-brand-secondary">Status</span>
            )}
          </div>
        }
        onChange={onChange}
        noChevron
      >
        {MODULE_STATUS.map((status) => (
          <CustomSelect.Option key={status.value} value={status.value}>
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: status.color,
                }}
              />
              {status.label}
            </div>
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    )}
  />
);
