import React from "react";
// react hook form
import { Controller, Control } from "react-hook-form";
// constants
import type { IIssue } from "types";
// import type { Control } from "react-hook-form";
import { PRIORITIES } from "constants/";
import { capitalizeFirstLetter } from "constants/common";
// icons
// ui
import { CustomListbox } from "components/ui";

// types
import { getPriorityIcon } from "constants/global";

type Props = {
  control: Control<IIssue, any>;
};

const SelectPriority: React.FC<Props> = ({ control }) => (
  <Controller
    control={control}
    name="priority"
    render={({ field: { value, onChange } }) => (
      <CustomListbox
        title="State"
        options={PRIORITIES?.map((priority) => ({
          value: priority,
          display: capitalizeFirstLetter(priority ?? "none"),
          icon: getPriorityIcon(priority),
        }))}
        value={value}
        optionsFontsize="sm"
        onChange={onChange}
        icon={getPriorityIcon(value)}
      />
    )}
  />
);

export default SelectPriority;
