/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { DueDatePropertyIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueDisplayProperties, TIssue } from "@plane/types";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
import { useProjectState } from "@/hooks/store/use-project-state";
import { ProgressTrackingBadge } from "./progress-tracking-badge";

export type TWorkItemLayoutAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
};

export function WorkItemLayoutAdditionalProperties({ displayProperties, issue }: TWorkItemLayoutAdditionalProperties) {
  const { t } = useTranslation();
  const { getStateById } = useProjectState();

  const stateDetails = getStateById(issue.state_id);

  // Fall back to now if backend hasn't returned completed_at yet (optimistic state update)
  const completedAt = issue.completed_at ?? new Date().toISOString();
  const formattedDate = `${renderFormattedDate(completedAt)} ${renderFormattedTime(completedAt, "12-hour")}`;

  return (
    <>
      {stateDetails?.group !== "completed" && stateDetails?.group !== "cancelled" && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="progress_tracking">
          <ProgressTrackingBadge targetDate={issue.target_date} />
        </WithDisplayPropertiesHOC>
      )}
      {stateDetails?.group === "completed" && (
        <Tooltip tooltipHeading={t("common.completed_at")} tooltipContent={formattedDate}>
          <div className="flex h-5 flex-shrink-0 items-center gap-1 overflow-hidden rounded-sm border-[0.5px] border-strong px-2.5 py-1">
            <DueDatePropertyIcon className="h-3 w-3 flex-shrink-0" />
            <span className="text-caption-sm-regular truncate max-w-28">{formattedDate}</span>
          </div>
        </Tooltip>
      )}
    </>
  );
}
