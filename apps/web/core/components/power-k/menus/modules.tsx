"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { ModuleStatusIcon } from "@plane/propel/icons";
import type { IModule } from "@plane/types";
// local imports
import { PowerKMenuBuilder } from "./builder";

type Props = {
  modules: IModule[];
  onSelect: (module: IModule) => void;
};

export const PowerKModulesMenu: React.FC<Props> = observer(({ modules, onSelect }) => (
  <PowerKMenuBuilder
    items={modules}
    getKey={(module) => module.id}
    getIconNode={(module) => <ModuleStatusIcon status={module.status ?? "backlog"} className="shrink-0 size-3.5" />}
    getValue={(module) => module.name}
    getLabel={(module) => module.name}
    onSelect={onSelect}
    emptyText="No modules found"
  />
));
