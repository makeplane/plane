import React from "react";

// react hook form
import { Controller, FieldError, Control } from "react-hook-form";
// ui
import { CustomListbox } from "components/ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
// types
import type { IModule } from "types";
// constants
import { MODULE_STATUS } from "constants/";

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
      <div>
        <CustomListbox
          className={`${
            error
              ? "border-red-500 bg-red-100 hover:bg-red-100 focus:outline-none focus:ring-red-500"
              : ""
          }`}
          title="Status"
          options={MODULE_STATUS.map((status) => ({
            value: status.value,
            display: status.label,
            color: status.color,
          }))}
          value={value}
          optionsFontsize="sm"
          onChange={onChange}
          icon={<Squares2X2Icon className={`h-3 w-3 ${error ? "text-black" : "text-gray-400"}`} />}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
      </div>
    )}
  />
);
