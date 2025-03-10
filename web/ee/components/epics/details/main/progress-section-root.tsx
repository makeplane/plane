"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TStateAnalytics } from "@plane/types";
import { InfoIcon, Tooltip } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web
import { ProgressSection } from "@/plane-web/components/common/layout/main/sections/progress-root";
import { useEpicAnalytics } from "@/plane-web/hooks/store";

type Props = {
  epicId: string;
};

export const EpicProgressSection: FC<Props> = observer((props) => {
  const { epicId } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { getEpicAnalyticsById } = useEpicAnalytics();

  // derived values
  const epicAnalytics = getEpicAnalyticsById(epicId);
  const epic = getIssueById(epicId);
  const shouldRenderProgressSection = (epic?.sub_issues_count ?? 0) > 0;

  if (!shouldRenderProgressSection) return <></>;

  return (
    <ProgressSection
      data={epicAnalytics as TStateAnalytics}
      indicatorElement={
        <Tooltip tooltipContent="The progress metrics aggregate all child work items from Epics." position="top-left">
          <span className="flex items-center justify-center size-4 text-custom-text-300 hover:text-custom-text-200 cursor-pointer">
            <InfoIcon className="size-3.5" />
          </span>
        </Tooltip>
      }
    />
  );
});
