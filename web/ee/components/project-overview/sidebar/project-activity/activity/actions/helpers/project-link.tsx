"use client";

import { FC } from "react";
// hooks
import { Tooltip } from "@plane/ui";
import { usePlatformOS } from "@/hooks/use-platform-os";
// ui

type TProjectLink = {
  activity: any;
};

export const ProjectLink: FC<TProjectLink> = (props) => {
  const { activity } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  if (!activity) return <></>;
  return (
    <Tooltip
      tooltipContent={activity.project_detail ? activity.project_detail.name : "This project has been deleted"}
      isMobile={isMobile}
    >
      <a
        aria-disabled={activity.project === null}
        href={`${
          activity.project_detail
            ? `/${activity.workspace_detail?.slug}/projects/${activity.project}/projects/${activity.project}`
            : "#"
        }`}
        target={activity.project === null ? "_self" : "_blank"}
        rel={activity.project === null ? "" : "noopener noreferrer"}
        className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
      >
        {activity.project_detail
          ? `${activity.project_detail.identifier}-${activity.project_detail.sequence_id}`
          : "Project"}{" "}
        <span className="font-normal">{activity.project_detail?.name}</span>
      </a>
    </Tooltip>
  );
};
