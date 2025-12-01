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
  value?: string[];
};

export const PowerKModulesMenu = observer(function PowerKModulesMenu({ modules, onSelect, value }: Props) {
  return (
    <PowerKMenuBuilder
      items={modules}
      getKey={(module) => module.id}
      getIconNode={(module) => <ModuleStatusIcon status={module.status ?? "backlog"} className="shrink-0 size-3.5" />}
      getValue={(module) => module.name}
      getLabel={(module) => module.name}
      isSelected={(module) => !!value?.includes(module.id)}
      onSelect={onSelect}
      emptyText="No modules found"
    />
  );
});
