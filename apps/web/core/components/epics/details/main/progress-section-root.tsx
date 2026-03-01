/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
// plane imports
import { InfoIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TStateAnalytics } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web
import { ProgressSection } from "@/components/common/layout/main/sections/progress-root";
import { useEpicAnalytics } from "@/plane-web/hooks/store";

type Props = {
  epicId: string;
};

export const EpicProgressSection = observer(function EpicProgressSection(props: Props) {
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
        <Tooltip tooltipContent="The progress metrics aggregate all child work items from Epics." position="top-start">
          <span className="flex items-center justify-center size-4 text-tertiary hover:text-secondary cursor-pointer">
            <InfoIcon className="size-3.5" />
          </span>
        </Tooltip>
      }
    />
  );
});
