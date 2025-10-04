"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { IModule } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  modules: IModule[];
  onSelect: (module: IModule) => void;
};

export const PowerKModulesMenu: React.FC<Props> = observer(({ modules, onSelect }) => (
  <PowerKMenuBuilder
    heading="Modules"
    items={modules}
    getKey={(module) => module.id}
    getLabel={(module) => module.name}
    onSelect={onSelect}
    emptyText="No modules found"
  />
));
