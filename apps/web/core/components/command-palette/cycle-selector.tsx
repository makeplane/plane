"use client";

import React from "react";
import { observer } from "mobx-react";
import type { ICycle } from "@plane/types";
import { CommandPaletteEntityList } from "./entity-list";

interface Props {
  cycles: ICycle[];
  onSelect: (cycle: ICycle) => void;
}

export const CommandPaletteCycleSelector: React.FC<Props> = observer(({ cycles, onSelect }) => (
  <CommandPaletteEntityList
    heading="Cycles"
    items={cycles}
    getKey={(cycle) => cycle.id}
    getLabel={(cycle) => cycle.name}
    onSelect={onSelect}
    emptyText="No cycles found"
  />
));
