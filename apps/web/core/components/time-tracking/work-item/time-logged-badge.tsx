/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueDisplayProperties, TIssue } from "@plane/types";
import { formatTimeDuration } from "@plane/utils";
// components
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectIssueTimeTotals } from "@/hooks/time-tracking/use-project-issue-time-totals";
import { useTimeTrackingPermissions } from "@/hooks/time-tracking/use-time-tracking-permissions";

type Props = {
  issue: TIssue;
  displayProperties: IIssueDisplayProperties;
};

/** A "⏱ 2h 30m" chip on list and board cards when "Time logged" is on and the work item has time. */
export const TimeLoggedBadge = observer(function TimeLoggedBadge({ issue, displayProperties }: Props) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const { canView } = useTimeTrackingPermissions(workspaceSlug?.toString());
  const { getTotalByIssueId } = useProjectIssueTimeTotals(
    canView && displayProperties.time_logged ? workspaceSlug?.toString() : undefined,
    issue.project_id
  );
  const total = getTotalByIssueId(issue.id) ?? 0;

  return (
    <WithDisplayPropertiesHOC
      displayProperties={displayProperties}
      displayPropertyKey="time_logged"
      shouldRenderProperty={(properties) => !!properties.time_logged && total > 0}
    >
      <Tooltip
        tooltipHeading={t("time-tracking.display_property")}
        tooltipContent={formatTimeDuration(total)}
        isMobile={isMobile}
        renderByDefault={false}
      >
        <div className="flex h-5 flex-shrink-0 items-center gap-1 rounded-sm border-[0.5px] border-strong px-2.5 py-1">
          <Timer className="h-3 w-3 flex-shrink-0" />
          <div className="text-caption-sm-regular tabular-nums">{formatTimeDuration(total)}</div>
        </div>
      </Tooltip>
    </WithDisplayPropertiesHOC>
  );
});
