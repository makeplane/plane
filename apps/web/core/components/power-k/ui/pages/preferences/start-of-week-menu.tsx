/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Command } from "cmdk";
// workspaces imports
import { START_OF_THE_WEEK_OPTIONS } from "@workspaces/constants";
import type { EStartOfTheWeek } from "@workspaces/types";
// local imports
import { PowerKModalCommandItem } from "../../modal/command-item";

type Props = {
  onSelect: (day: EStartOfTheWeek) => void;
};

export function PowerKPreferencesStartOfWeekMenu(props: Props) {
  const { onSelect } = props;

  return (
    <Command.Group>
      {START_OF_THE_WEEK_OPTIONS.map((day) => (
        <PowerKModalCommandItem key={day.value} onSelect={() => onSelect(day.value)} label={day.label} />
      ))}
    </Command.Group>
  );
}
