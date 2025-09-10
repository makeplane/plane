"use client";

import React from "react";
import type { ICycle } from "@/plane-web/types";
import { CommandPaletteEntityList } from "./entity-list";

interface Props {
  cycles: ICycle[];
  onSelect: (cycle: ICycle) => void;
}

export const CommandPaletteCycleSelector: React.FC<Props> = ({ cycles, onSelect }) => (
  <CommandPaletteEntityList
    heading="Cycles"
    items={cycles}
    getKey={(cycle) => cycle.id}
    getLabel={(cycle) => cycle.name}
    onSelect={onSelect}
    emptyText="No cycles found"
  />
);

