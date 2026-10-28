/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { CircularProgress } from "@makeplane/propel/components/circular-progress";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { SegmentedProgress } from "@plane/blocks/progress";
import { STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType, TStateGroups } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  parentIssueId: string;
  issueServiceType?: TIssueServiceType;
};

const ORDERED_STATE_GROUPS: TStateGroups[] = ["backlog", "unstarted", "started", "completed", "cancelled"];

/**
 * Completed / total sub-work items as a compact ring + count chip next to the section title. Hovering it
 * opens a breakdown by state group.
 */
export const SubIssuesProgressChip = observer(function SubIssuesProgressChip(props: Props) {
  const { parentIssueId, issueServiceType = EIssueServiceType.ISSUES } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    subIssues: { subIssuesByIssueId, stateDistributionByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const subIssuesDistribution = stateDistributionByIssueId(parentIssueId);
  const subIssues = subIssuesByIssueId(parentIssueId);
  // if there are no sub-issues, return null
  if (!subIssues?.length) return null;

  // calculate percentage of completed sub-issues
  const completedCount = subIssuesDistribution?.completed?.length ?? 0;
  const totalCount = subIssues.length;
  const percentage = completedCount && totalCount ? (completedCount / totalCount) * 100 : 0;
  const stateGroupStats = ORDERED_STATE_GROUPS.map((group) => ({
    id: group,
    name: t(`workspace_projects.state.${group}`),
    value: subIssuesDistribution?.[group]?.length ?? 0,
    color: STATE_GROUPS[group].color,
  }));

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        aria-label={`${completedCount}/${totalCount} ${t("common.done")}`}
        render={
          <button
            type="button"
            className="flex h-5 items-center gap-1 rounded-sm px-1.5 text-secondary outline-none hover:bg-layer-1-hover focus-visible:ring-2 focus-visible:ring-accent-strong"
          >
            <CircularProgress
              value={percentage}
              size="sm"
              variant={percentage === 100 ? "success" : "brand"}
              aria-label={t("common.progress")}
            />
            <span className="text-caption-md-medium leading-none">
              {completedCount}/{totalCount}
            </span>
          </button>
        }
      />
      <PopoverContent variant="rich" side="bottom" align="start">
        <div className="w-[26rem] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body-sm-medium text-primary">{t("common.progress")}</span>
            <span className="text-caption-md-medium text-secondary">{Math.round(percentage)}%</span>
          </div>
          <SegmentedProgress data={stateGroupStats} aria-label={t("common.progress")} />
          <div className="grid grid-cols-5 gap-3">
            {stateGroupStats.map((stat) => (
              <div key={stat.id} className="flex flex-col gap-1 py-1.5">
                <span className="flex items-center gap-1 text-caption-md-medium whitespace-nowrap text-secondary">
                  <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: stat.color }} />
                  {stat.name}
                </span>
                <span className="pl-3 text-body-sm-medium text-primary">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
