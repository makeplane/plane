"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// ui
import { Tooltip, ModuleStatusIcon } from "@plane/ui";
// components
import { SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
// constants
import { MODULE_STATUS } from "@/constants/module";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useModule } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleGanttBlock: React.FC<Props> = observer((props) => {
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

  return (
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
      <div
        className="relative flex h-full w-full cursor-pointer items-center rounded"
        style={{ backgroundColor: MODULE_STATUS.find((s) => s.value === moduleDetails?.status)?.color }}
        onClick={() =>
          router.push(
            `/${workspaceSlug?.toString()}/projects/${moduleDetails?.project_id}/modules/${moduleDetails?.id}`
          )
        }
      >
        <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
        <div
          className="sticky w-auto overflow-hidden truncate px-2.5 py-1 text-sm text-custom-text-100"
          style={{ left: `${SIDEBAR_WIDTH}px` }}
        >
          {moduleDetails?.name}
        </div>
      </div>
    </Tooltip>
  );
});

export const ModuleGanttSidebarBlock: React.FC<Props> = observer((props) => {
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
      <h6 className="flex-grow truncate text-sm font-medium">{moduleDetails?.name}</h6>
    </Link>
  );
});
