import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// constants
import { PRIORITIES } from "constants/";
import { capitalizeFirstLetter } from "constants/common";
// icons
import { ChartBarIcon } from "@heroicons/react/24/outline";
// ui
import { CustomListbox } from "ui";

// types
import type { IIssue } from "types";
import type { Control } from "react-hook-form";
import { getPriorityIcon } from "constants/global";

type Props = {
  control: Control<IIssue, any>;
};

const SelectPriority: React.FC<Props> = ({ control }) => {
  return (
    <Controller
      control={control}
      name="priority"
      render={({ field: { value, onChange } }) => (
        <CustomListbox
          title="State"
          options={PRIORITIES?.map((priority) => {
            return {
              value: priority,
              display: capitalizeFirstLetter(priority ?? "none"),
              icon: getPriorityIcon(priority),
            };
          })}
          value={value}
          optionsFontsize="sm"
          onChange={onChange}
          icon={getPriorityIcon(value)}
        />
      )}
    />
  );
};

export default SelectPriority;
