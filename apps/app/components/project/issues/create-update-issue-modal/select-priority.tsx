import React from "react";

// react hook form
import { Controller, Control } from "react-hook-form";
// types
import type { IIssue } from "types";
// components
import { CustomListbox } from "components/ui";
// helpers
import { capitalizeFirstLetter } from "helpers/string.helper";
// constants
import { getPriorityIcon } from "constants/global";
import { PRIORITIES } from "constants/";

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
