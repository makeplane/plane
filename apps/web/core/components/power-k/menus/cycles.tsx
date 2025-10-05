"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { ICycle } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  cycles: ICycle[];
  onSelect: (cycle: ICycle) => void;
};

export const PowerKCyclesMenu: React.FC<Props> = observer(({ cycles, onSelect }) => (
  <PowerKMenuBuilder
    heading="Cycles"
    items={cycles}
    getKey={(cycle) => cycle.id}
    getLabel={(cycle) => cycle.name}
    onSelect={onSelect}
    emptyText="No cycles found"
  />
));
