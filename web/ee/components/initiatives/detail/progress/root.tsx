"use client";

import React, { FC } from "react";
import { omit } from "lodash";
import { observer } from "mobx-react";
import { LinearProgressIndicator } from "@plane/ui";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TEpicAnalytics } from "@/plane-web/types";

type TInitiativeProgressRootProps = {
  workspaceSlug: string;
  initiativeId: string;
};

export const INITIATIVE_PROGRESS_STATE_GROUPS_DETAILS: {
  key: keyof TEpicAnalytics;
  title: string;
  color: string;
}[] = [
  {
    key: "overdue_issues",
    title: "Overdue",
    color: "#FF333380",
  },
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#EBEDF2",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#6E6E6E80",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#FF813380",
  },
  {
    key: "completed_issues",
    title: "Completed",
    color: "#26D95080",
  },
  {
    key: "cancelled_issues",
    title: "Cancelled",
    color: "#FF333350",
  },
];

export const InitiativeProgressRoot: FC<TInitiativeProgressRootProps> = observer((props) => {
  const { workspaceSlug, initiativeId } = props;
  // store hooks
  const {
    initiative: { getInitiativeAnalyticsById },
  } = useInitiatives();

  // derived values
  const initiativeAnalytics = getInitiativeAnalyticsById(initiativeId);

  const totalIssues = initiativeAnalytics
    ? Object.values(omit(initiativeAnalytics, "overdue_issues")).reduce((acc, val) => acc + val, 0)
    : 0;

  const progressIndicatorData = INITIATIVE_PROGRESS_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: initiativeAnalytics ? initiativeAnalytics[group.key] : 0,
    color: group.color,
    percentage: initiativeAnalytics ? (initiativeAnalytics[group.key] / totalIssues) * 100 : 0,
  }));

  return (
    <div className="py-4 border-y border-custom-border-200">
      <div className="flex flex-col gap-4">
        <div className="flex items-center ">
          <span className="text-base text-custom-text-300 font-medium w-">Progress</span>
        </div>
        <div className="flex flex-col gap-3">
          <LinearProgressIndicator
            size="xl"
            data={progressIndicatorData}
            barClassName="first:rounded last:rounded rounded"
            className="bg-transparent gap-0.5 rounded p-0"
          />
          <div className="grid grid-cols-12 gap-2 lg:gap-3 justify-between">
            {progressIndicatorData.map((data) => (
              <div
                key={data.id}
                className="flex flex-col gap-1 px-3 py-2 col-span-6 md:col-span-4 lg:col-span-2 w-full"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-sm flex-shrink-0"
                    style={{
                      backgroundColor: data.color,
                    }}
                  />
                  <span className="text-sm font-medium leading-4">{data.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold leading-6">{data.value}</span>
                  <span className="text-sm font-medium text-custom-text-400 leading-4">
                    {Math.round(data.percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
