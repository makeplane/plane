"use client";

import { observer } from "mobx-react";
// planes
import { cn } from "@plane/editor";
import { DiceIcon, Tooltip } from "@plane/ui";
// hooks
import { useModule } from "@/hooks/store/use-module";

type Props = {
  moduleIds: string[] | undefined;
  shouldShowBorder?: boolean;
};

export const IssueBlockModules = observer(({ moduleIds, shouldShowBorder = true }: Props) => {
  const { getModulesByIds } = useModule();

  const modules = getModulesByIds(moduleIds ?? []);

  const modulesString = modules.map((module) => module.name).join(", ");

  return (
    <div className="relative flex h-full flex-wrap items-center gap-1">
      <Tooltip tooltipHeading="Modules" tooltipContent={modulesString}>
        {modules.length <= 1 ? (
          <div
            key={modules?.[0]?.id}
            className={cn("flex h-full flex-shrink-0 cursor-default items-center rounded-md px-2.5 py-1 text-xs", {
              "border-[0.5px] border-custom-border-300": shouldShowBorder,
            })}
          >
            <div className="flex items-center gap-1.5 text-custom-text-200">
              <DiceIcon className="h-3 w-3 flex-shrink-0" />
              <div className="text-xs">{modules?.[0]?.name ?? "No Modules"}</div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-shrink-0 cursor-default items-center rounded-md border border-custom-border-300 px-2.5 py-1 text-xs">
            <div className="flex items-center gap-1.5 text-custom-text-200">
              <div className="text-xs">{modules.length} Modules</div>
            </div>
          </div>
        )}
      </Tooltip>
    </div>
  );
});
