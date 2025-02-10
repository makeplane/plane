"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TStateAnalytics } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web
import { ProgressSection } from "@/plane-web/components/common/layout/main/sections/progress-root";
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  epicId: string;
};

export const EpicProgressSection: FC<Props> = observer((props) => {
  const { epicId } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { getEpicAnalyticsById } = useIssueTypes();

  // derived values
  const epicAnalytics = getEpicAnalyticsById(epicId);
  const epic = getIssueById(epicId);
  const shouldRenderProgressSection = (epic?.sub_issues_count ?? 0) > 0;

  if (!shouldRenderProgressSection) return <></>;

  return <ProgressSection data={epicAnalytics as TStateAnalytics} />;
});
