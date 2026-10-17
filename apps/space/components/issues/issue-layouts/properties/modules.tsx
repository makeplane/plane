/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane ui
import { ModuleOutline } from "@makeplane/propel/icons";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { ReadOnlyProperty } from "./read-only-property";

type Props = {
  moduleIds: string[] | undefined;
  shouldShowBorder?: boolean;
};

export const IssueBlockModules = observer(function IssueBlockModules({ moduleIds, shouldShowBorder = true }: Props) {
  const { getModulesByIds } = useModule();

  const modules = getModulesByIds(moduleIds ?? []);

  const modulesString = modules.map((module) => module.name).join(", ");

  return (
    <ReadOnlyProperty
      icon={ModuleOutline}
      label={modules.length > 1 ? `${modules.length} Modules` : (modules[0]?.name ?? "No Modules")}
      tooltip={`Modules: ${modulesString || "None"}`}
      shouldShowBorder={shouldShowBorder}
    />
  );
});
