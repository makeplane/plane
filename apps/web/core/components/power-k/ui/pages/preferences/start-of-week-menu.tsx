"use client";

import React from "react";
import { Command } from "cmdk";
// plane imports
import { START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { EStartOfTheWeek } from "@plane/types";
// local imports
import { PowerKModalCommandItem } from "../../modal/command-item";

type Props = {
  onSelect: (day: EStartOfTheWeek) => void;
};

export const PowerKPreferencesStartOfWeekMenu: React.FC<Props> = (props) => {
  const { onSelect } = props;

  return (
    <Command.Group>
      {START_OF_THE_WEEK_OPTIONS.map((day) => (
        <PowerKModalCommandItem key={day.value} onSelect={() => onSelect(day.value)} label={day.label} />
      ))}
    </Command.Group>
  );
};
