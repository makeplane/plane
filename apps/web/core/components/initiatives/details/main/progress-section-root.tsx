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
// plane web
import { ProgressSection } from "@/components/common/layout/main/sections/progress-root";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  initiativeId: string;
};

export const InitiativeProgressSection = observer(function InitiativeProgressSection(props: Props) {
  const { initiativeId } = props;
  // store hooks
  const {
    initiative: { getInitiativeById, getInitiativeAnalyticsById },
  } = useInitiatives();

  // derived values
  const initiative = getInitiativeById(initiativeId);
  const cumulatedAnalytics = getInitiativeAnalyticsById(initiativeId)?.total_count;

  const projectsIds = initiative?.project_ids ?? [];
  const initiativeEpics = initiative?.epic_ids ?? [];
  const totalIssues = Object.values(cumulatedAnalytics ?? {}).reduce((acc, val) => acc + val, 0);

  const shouldRenderProgressSection = (projectsIds.length ?? 0) > 0 || initiativeEpics.length > 0 || totalIssues > 0;

  if (!shouldRenderProgressSection) return <></>;

  return (
    <ProgressSection
      data={cumulatedAnalytics as TStateAnalytics}
      indicatorElement={
        <>
          <Tooltip
            tooltipContent="The progress metrics aggregate all child work items from both Epics and Projects."
            position="top-start"
          >
            <span className="flex items-center justify-center size-4 text-tertiary hover:text-secondary cursor-pointer">
              <InfoIcon className="size-3.5" />
            </span>
          </Tooltip>
        </>
      }
    />
  );
});
