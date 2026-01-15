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

  return (
    <div className="relative flex h-full flex-wrap items-center gap-1">
      <Tooltip tooltipHeading="Modules" tooltipContent={modulesString}>
        {modules.length <= 1 ? (
          <div
            key={modules?.[0]?.id}
            className={cn("flex h-full flex-shrink-0 cursor-default items-center rounded-md px-2.5 py-1 text-11", {
              "border-[0.5px] border-strong": shouldShowBorder,
            })}
          >
            <div className="flex items-center gap-1.5 text-secondary">
              <ModuleIcon className="h-3 w-3 flex-shrink-0" />
              <div className="text-11">{modules?.[0]?.name ?? "No Modules"}</div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-shrink-0 cursor-default items-center rounded-md border border-strong px-2.5 py-1 text-11">
            <div className="flex items-center gap-1.5 text-secondary">
              <div className="text-11">{modules.length} Modules</div>
            </div>
          </div>
        )}
      </Tooltip>
    </div>
  );
});
