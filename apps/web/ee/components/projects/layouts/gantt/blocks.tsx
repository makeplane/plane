"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { IGanttBlock } from "@plane/types";
import { Logo, Tooltip } from "@plane/ui";
import { findTotalDaysInRange, renderFormattedDate } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { EProjectScope } from "@/plane-web/types/workspace-project-filters";
import JoinButton from "../../common/join-button";

type Props = {
  projectId: string;
};
type SidebarProps = {
  block: IGanttBlock;
};

export const ProjectGanttBlock: React.FC<Props> = observer((props) => {
  const { projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { projectStates } = useWorkspaceProjectStates();

  // derived values
  const projectDetails = getProjectById(projectId);

  const stateDetails = projectDetails && projectStates[projectDetails.state_id!];

  const { isMobile } = usePlatformOS();

  return (
    <div
      id={`project-${projectId}`}
      className="relative flex h-full w-full cursor-pointer items-center rounded"
      style={{
        backgroundColor: stateDetails?.color,
      }}
    >
      <div className="absolute left-0 top-0 h-full w-full bg-custom-background-100/50" />
      <Tooltip
        isMobile={isMobile}
        tooltipContent={
          <div className="space-y-1">
            <h5>{projectDetails?.name}</h5>
            <div>
              {renderFormattedDate(projectDetails?.start_date ?? "")} to{" "}
              {renderFormattedDate(projectDetails?.target_date ?? "")}
            </div>
          </div>
        }
        position="top-left"
      >
        <div className="relative w-full overflow-hidden truncate px-2.5 py-1 text-sm text-custom-text-100">
          {projectDetails?.name}
        </div>
      </Tooltip>
    </div>
  );
});

// rendering projects on gantt sidebar
export const ProjectGanttSidebarBlock: React.FC<SidebarProps> = observer((props) => {
  const { block } = props;
  const { filters } = useProjectFilter();

  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();

  // derived values
  const projectDetails = block.data;
  const duration = findTotalDaysInRange(projectDetails.start_date, projectDetails.target_date);

  const { isMobile } = usePlatformOS();
  const children = (
    <>
      <div className="relative flex h-full w-full items-center gap-2 py-3">
        <div className="flex-shrink-0 text-xs text-custom-text-300 mr-3 w-[40px]">
          {projectDetails.identifier} {projectDetails?.sequence_id}
        </div>
        <Logo logo={projectDetails.logo_props} size={16} />
        <Tooltip tooltipContent={projectDetails?.name} isMobile={isMobile}>
          <span className="flex-grow text-sm font-medium max-w-[150px] truncate">{projectDetails?.name}</span>
        </Tooltip>
      </div>
      {filters?.scope === EProjectScope.ALL_PROJECTS && <JoinButton project={projectDetails} />}
      {duration && (
        <div className="flex-shrink-0 h-full text-sm font-medium py-3 ml-2">
          {duration} day{duration > 1 ? "s" : ""}
        </div>
      )}
    </>
  );
  return !!projectDetails.member_role ? (
    <Link
      href={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
      className="px-page-x w-full cursor-pointer text-sm text-custom-text-100 flex justify-between h-11"
    >
      {children}
    </Link>
  ) : (
    <div className="px-page-x w-full cursor-not-allowed text-sm text-custom-text-100 flex justify-between h-11">
      {children}
    </div>
  );
});
