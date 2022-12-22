// react
import React from "react";
// react hook form
import { Controller } from "react-hook-form";
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
};

const SelectStatus: React.FC<Props> = ({ control }) => {
  return (
    <Controller
      control={control}
      name="status"
      render={({ field: { value, onChange } }) => (
        <CustomListbox
          title="State"
          options={MODULE_STATUS.map((status) => {
            return { value: status.value, display: status.label };
          })}
          value={value}
          optionsFontsize="sm"
          onChange={onChange}
          icon={<Squares2X2Icon className="h-3 w-3 text-gray-400" />}
        />
      )}
    />
  );
};

export default SelectStatus;
