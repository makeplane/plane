import type { TPartialProject } from "@/plane-web/types";
// plane propel imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";

type TProjectHeaderButtonProps = {
  project: TPartialProject;
};

export function ProjectHeaderButton({ project }: TProjectHeaderButtonProps) {
  return (
    <Tooltip tooltipContent={project.name} position="bottom">
      <div className="relative flex items-center text-left select-none w-full max-w-48 pr-1">
        <div className="size-7 rounded-md bg-layer-1 flex items-center justify-center flex-shrink-0">
          <Logo logo={project.logo_props} size={16} />
        </div>
        <div className="relative flex-1 min-w-0 hover:rounded">
          <p className="truncate text-14 font-medium text-secondary px-2">{project.name}</p>
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="relative h-full w-8 flex items-center justify-end">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-2 rounded-r" />
              <ChevronDownIcon className="relative z-10 size-4 text-tertiary" />
            </div>
          </div>
        </div>
      </div>
    </Tooltip>
  );
}
