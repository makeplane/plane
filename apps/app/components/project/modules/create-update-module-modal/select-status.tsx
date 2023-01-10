// react
import React from "react";
// react hook form
import { Controller, FieldError } from "react-hook-form";
import type { Control } from "react-hook-form";
// ui
import { CustomListbox } from "ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
// types
import type { IModule } from "types";
import { MODULE_STATUS } from "constants/";

type Props = {
  control: Control<IModule, any>;
  error?: FieldError;
};

const SelectStatus: React.FC<Props> = (props) => {
  const { control, error } = props;

  return (
    <Controller
      control={control}
      rules={{ required: true }}
      name="status"
      render={({ field: { value, onChange } }) => (
        <div>
          <CustomListbox
            className={`${
              error
                ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500"
                : ""
            }`}
            title="Status"
            options={MODULE_STATUS.map((status) => {
              return { value: status.value, display: status.label, color: status.color };
            })}
            value={value}
            optionsFontsize="sm"
            onChange={onChange}
            icon={<Squares2X2Icon className="h-3 w-3 text-gray-400" />}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
        </div>
      )}
    />
  );
};

export default SelectStatus;
