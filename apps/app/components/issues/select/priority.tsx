import React from "react";
import { Controller, Control } from "react-hook-form";
// components
import { CustomListbox } from "components/ui";
// helpers
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import type { IIssue } from "types";
// constants
import { getPriorityIcon } from "constants/global";
import { PRIORITIES } from "constants/";

type Props = {
  control: Control<IIssue, any>;
};

export const IssuePrioritySelect: React.FC<Props> = ({ control }) => (
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
