"use client";

import React, { FC, useState } from "react";
import { omit } from "lodash";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { Collapsible, CollapsibleButton, LinearProgressIndicator } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
import { useIssueTypes } from "@/plane-web/hooks/store";
import { TEpicAnalytics } from "@/plane-web/types";

type TEpicProgressRootProps = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
};

export const EPIC_PROGRESS_STATE_GROUPS_DETAILS: {
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

export const EpicProgressRoot: FC<TEpicProgressRootProps> = observer((props) => {
  const { workspaceSlug, projectId, epicId } = props;
  // states
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(true);
  // store hooks
  const { getEpicAnalyticsById } = useIssueTypes();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const issue = getIssueById(epicId);
  const epicAnalytics = getEpicAnalyticsById(epicId);

  const totalIssues = epicAnalytics
    ? Object.values(omit(epicAnalytics, "overdue_issues")).reduce((acc, val) => acc + val, 0)
    : 0;

  const progressIndicatorData = EPIC_PROGRESS_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: epicAnalytics ? epicAnalytics[group.key] : 0,
    color: group.color,
    percentage: epicAnalytics ? (epicAnalytics[group.key] / totalIssues) * 100 : 0,
  }));

  if (issue?.sub_issues_count === 0) return null;

  return (
    <div className="py-4 border-y border-custom-border-200">
      <Collapsible
        isOpen={isCollapsibleOpen}
        onToggle={() => setIsCollapsibleOpen(!isCollapsibleOpen)}
        title={
          <CollapsibleButton
            isOpen={isCollapsibleOpen}
            title="Progress"
            className="border-none py-0 h-auto"
            titleClassName="text-custom-text-300"
          />
        }
        buttonClassName="w-full"
      >
        <div className="flex flex-col gap-3 pt-4">
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
      </Collapsible>
    </div>
  );
});
