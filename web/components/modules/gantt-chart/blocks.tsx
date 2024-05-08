import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
// hooks
// ui
import { Tooltip, ModuleStatusIcon } from "@plane/ui";
// helpers
import { MODULE_STATUS } from "@/constants/module";
import { renderFormattedDate } from "@/helpers/date-time.helper";
// constants
import { useAppRouter, useModule } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleGanttBlock: React.FC<Props> = observer((props) => {
  const { moduleId } = props;
  // router
  const router = useRouter();
  // store hooks
  const { workspaceSlug } = useAppRouter();
  const { getModuleById } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div
      className="relative flex h-full w-full items-center rounded"
      style={{ backgroundColor: MODULE_STATUS.find((s) => s.value === moduleDetails?.status)?.color }}
      onClick={() =>
        router.push(`/${workspaceSlug}/projects/${moduleDetails?.project_id}/modules/${moduleDetails?.id}`)
      }
    >
      <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        isMobile={isMobile}
        tooltipContent={
          <div className="space-y-1">
            <h5>{moduleDetails?.name}</h5>
            <div>
              {renderFormattedDate(moduleDetails?.start_date ?? "")} to{" "}
              {renderFormattedDate(moduleDetails?.target_date ?? "")}
            </div>
          </div>
        }
        position="top-left"
      >
        <div className="relative w-full truncate px-2.5 py-1 text-sm text-custom-text-100">{moduleDetails?.name}</div>
      </Tooltip>
    </div>
  );
});

export const ModuleGanttSidebarBlock: React.FC<Props> = observer((props) => {
  const { moduleId } = props;
  // store hooks
  const { workspaceSlug } = useAppRouter();
  const { getModuleById } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);

  return (
    <Link
      className="relative flex h-full w-full items-center gap-2"
      href={`/${workspaceSlug}/projects/${moduleDetails?.project_id}/modules/${moduleDetails?.id}`}
    >
      <ModuleStatusIcon status={moduleDetails?.status ?? "backlog"} height="16px" width="16px" />
      <h6 className="flex-grow truncate text-sm font-medium">{moduleDetails?.name}</h6>
    </Link>
  );
});
