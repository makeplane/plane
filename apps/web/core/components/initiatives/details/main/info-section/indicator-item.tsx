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
import { omit } from "lodash-es";
import { observer } from "mobx-react";
// ui
import { CircularProgressIndicator } from "@plane/ui";
// helpers
import { getProgress } from "@plane/utils";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  initiativeId: string;
};

export const InitiativeInfoIndicatorItem = observer(function InitiativeInfoIndicatorItem(props: Props) {
  const { initiativeId } = props;
  // hooks
  const {
    initiative: { getInitiativeById, getInitiativeAnalyticsById },
  } = useInitiatives();

  // derived values
  const initiative = getInitiativeById(initiativeId);
  const initiativeAnalytics = getInitiativeAnalyticsById(initiativeId)?.total_count;

  if (!initiative) return <></>;

  // derived values
  const totalIssues = initiativeAnalytics
    ? Object.values(omit(initiativeAnalytics, "overdue_issues")).reduce((acc, val) => acc + val, 0)
    : 0;

  const completedStateCount =
    (initiativeAnalytics?.completed_issues || 0) + (initiativeAnalytics?.cancelled_issues || 0);
  const completePercentage = getProgress(completedStateCount ?? 0, totalIssues);

  return (
    <div className="flex-shrink-0">
      <CircularProgressIndicator percentage={completePercentage} strokeWidth={4} size={46}>
        <span className="flex items-baseline justify-center text-12 stroke-success">
          <span className="font-semibold">{completePercentage}</span>
          <span>%</span>
        </span>
      </CircularProgressIndicator>
    </div>
  );
});
