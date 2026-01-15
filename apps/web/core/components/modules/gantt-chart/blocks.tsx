import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// ui
import { MODULE_STATUS } from "@plane/constants";
import { ModuleStatusIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// components
import { SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
import { getBlockViewDetails } from "@/components/issues/issue-layouts/utils";
// constants
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleGanttBlock = observer(function ModuleGanttBlock(props: Props) {
  const { moduleId } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);
  // hooks
  const { isMobile } = usePlatformOS();

  const { message, blockStyle } = getBlockViewDetails(
    moduleDetails,
    MODULE_STATUS.find((s) => s.value === moduleDetails?.status)?.color ?? ""
  );

  return (
    <Tooltip
      isMobile={isMobile}
      tooltipContent={
        <div className="space-y-1">
          <h5>{moduleDetails?.name}</h5>
          <div>{message}</div>
        </div>
      }
      position="top-start"
    >
      <div
        className="relative flex h-full w-full cursor-pointer items-center rounded-sm"
        style={blockStyle}
        onClick={() =>
          router.push(
            `/${workspaceSlug?.toString()}/projects/${moduleDetails?.project_id}/modules/${moduleDetails?.id}`
          )
        }
      >
        <div className="absolute left-0 top-0 h-full w-full bg-surface-1/50" />
        <div
          className="sticky w-auto overflow-hidden truncate px-2.5 py-1 text-13 text-primary"
          style={{ left: `${SIDEBAR_WIDTH}px` }}
        >
          {moduleDetails?.name}
        </div>
      </div>
    </Tooltip>
  );
});

export const ModuleGanttSidebarBlock = observer(function ModuleGanttSidebarBlock(props: Props) {
  const { moduleId } = props;
  const { workspaceSlug } = useParams();
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);

  return (
    <Link
      className="relative flex h-full w-full items-center gap-2"
      href={`/${workspaceSlug?.toString()}/projects/${moduleDetails?.project_id}/modules/${moduleDetails?.id}`}
      draggable={false}
    >
      <ModuleStatusIcon status={moduleDetails?.status ?? "backlog"} height="16px" width="16px" />
      <h6 className="flex-grow truncate text-13 font-medium">{moduleDetails?.name}</h6>
    </Link>
  );
});
