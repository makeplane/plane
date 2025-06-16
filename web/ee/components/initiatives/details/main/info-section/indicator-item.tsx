"use client";

import { FC } from "react";
import { omit } from "lodash";
import { observer } from "mobx-react";
// ui
import { CircularProgressIndicator } from "@plane/ui";
// helpers
import { getProgress  } from "@plane/utils";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  initiativeId: string;
};

export const InitiativeInfoIndicatorItem: FC<Props> = observer((props) => {
  const { initiativeId } = props;
  // hooks
  const {
    initiative: { getInitiativeById, getInitiativeAnalyticsById },
  } = useInitiatives();

  // derived values
  const initiative = getInitiativeById(initiativeId);
  const initiativeAnalytics = getInitiativeAnalyticsById(initiativeId);

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
      <CircularProgressIndicator
        percentage={completePercentage}
        strokeWidth={4}
        size={46}
        strokeColor="stroke-green-500"
      >
        <span className="flex items-baseline justify-center text-sm text-custom-primary-100">
          <span className="font-semibold">{completePercentage}</span>
          <span>%</span>
        </span>
      </CircularProgressIndicator>
    </div>
  );
});
