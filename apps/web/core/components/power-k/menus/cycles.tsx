"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { ContrastIcon } from "@plane/propel/icons";
import type { ICycle } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  cycles: ICycle[];
  onSelect: (cycle: ICycle) => void;
};

export const PowerKCyclesMenu: React.FC<Props> = observer(({ cycles, onSelect }) => (
  <PowerKMenuBuilder
    items={cycles}
    getIcon={() => ContrastIcon}
    getKey={(cycle) => cycle.id}
    getValue={(cycle) => cycle.name}
    getLabel={(cycle) => cycle.name}
    onSelect={onSelect}
    emptyText="No cycles found"
  />
));
