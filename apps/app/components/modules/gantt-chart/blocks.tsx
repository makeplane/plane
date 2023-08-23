import Link from "next/link";
import { useRouter } from "next/router";

// ui
import { Tooltip } from "components/ui";
// helpers
import { renderShortDate } from "helpers/date-time.helper";
// types
import { IModule } from "types";
// constants
import { MODULE_STATUS } from "constants/module";

export const ModuleGanttBlock = ({ module }: { module: IModule }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Link href={`/${workspaceSlug}/projects/${module?.project}/modules/${module?.id}`}>
      <a
        className="relative flex items-center w-full h-full rounded"
        style={{ backgroundColor: MODULE_STATUS.find((s) => s.value === module?.status)?.color }}
      >
        <div className="absolute top-0 left-0 h-full w-full bg-custom-background-100/50" />
        <Tooltip
          tooltipContent={
            <div className="space-y-1">
              <h5>{module?.name}</h5>
              <div>
                {renderShortDate(module?.start_date ?? "")} to{" "}
                {renderShortDate(module?.target_date ?? "")}
              </div>
            </div>
          }
          position="top-left"
        >
          <div className="relative text-custom-text-100 text-sm truncate py-1 px-2.5 w-full">
            {module?.name}
          </div>
        </Tooltip>
      </a>
    </Link>
  );
};

export const ModuleGanttSidebarBlock = ({ module }: { module: IModule }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Link href={`/${workspaceSlug}/projects/${module?.project}/issues/${module?.id}`}>
      <a className="relative w-full flex items-center gap-2 h-full">
        <h6 className="text-sm font-medium flex-grow truncate">{module?.name}</h6>
      </a>
    </Link>
  );
};
