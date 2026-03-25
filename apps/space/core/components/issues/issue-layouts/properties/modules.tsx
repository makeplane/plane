/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane ui
import { ModuleIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useModule } from "@/hooks/store/use-module";

type Props = {
  moduleIds: string[] | undefined;
  shouldShowBorder?: boolean;
};

export const IssueBlockModules = observer(function IssueBlockModules({ moduleIds, shouldShowBorder = true }: Props) {
  const { getModulesByIds } = useModule();

  const modules = getModulesByIds(moduleIds ?? []);

  const modulesString = modules.map((module) => module.name).join(", ");

  const moduleName = (() => {
    if (modules.length === 0) {
      return "No Modules";
    }
    if (modules.length === 1) {
      return modules[0].name;
    }
    return `${modules.length} Modules`;
  })();

  return (
    <Tooltip tooltipHeading="Modules" tooltipContent={modulesString}>
      <div
        className={cn(
          "flex shrink-0 cursor-default items-center h-full rounded-sm px-2.5 py-1.5 text-caption-sm-regular",
          {
            "border-[0.5px] border-strong": shouldShowBorder,
          }
        )}
      >
        <div className="flex items-center gap-1.5 text-secondary">
          <ModuleIcon className="h-3 w-3 shrink-0" />
          <div className="text-caption-sm-regular">{moduleName}</div>
        </div>
      </div>
    </Tooltip>
  );
});
