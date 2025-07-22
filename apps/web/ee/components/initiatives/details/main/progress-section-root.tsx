"use client";

import React, { FC } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
import { TStateAnalytics } from "@plane/types";
import { InfoIcon, Tooltip } from "@plane/ui";
// plane web
import { ProgressSection } from "@/plane-web/components/common/layout/main/sections/progress-root";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  initiativeId: string;
};

export const InitiativeProgressSection: FC<Props> = observer((props) => {
  const { initiativeId } = props;
  // store hooks
  const {
    initiative: { getInitiativeById, getInitiativeAnalyticsById },
  } = useInitiatives();

  // derived values
  const initiative = getInitiativeById(initiativeId);
  const initiativeProjectAnalytics = getInitiativeAnalyticsById(initiativeId)?.project;

  const projectsIds = initiative?.project_ids ?? [];
  const initiativeEpics = initiative?.epic_ids ?? [];
  const totalIssues = initiativeProjectAnalytics
    ? Object.values(omit(initiativeProjectAnalytics, "overdue_issues")).reduce((acc, val) => acc + val, 0)
    : 0;

  const shouldRenderProgressSection = (projectsIds.length ?? 0) > 0 || initiativeEpics.length > 0 || totalIssues > 0;

  if (!shouldRenderProgressSection) return <></>;

  return (
    <ProgressSection
      data={initiativeProjectAnalytics as TStateAnalytics}
      indicatorElement={
        <>
          <Tooltip
            tooltipContent="The progress metrics aggregate all child work items from both Epics and Projects."
            position="top-left"
          >
            <span className="flex items-center justify-center size-4 text-custom-text-300 hover:text-custom-text-200 cursor-pointer">
              <InfoIcon className="size-3.5" />
            </span>
          </Tooltip>
        </>
      }
    />
  );
});
