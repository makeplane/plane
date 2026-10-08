/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Plus, Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Popover } from "@plane/propel/popover";
import { Tooltip } from "@plane/propel/tooltip";
import { formatTimeDuration } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useTimer } from "@/hooks/store/use-timer";
import { useTimeTrackingPermissions } from "@/hooks/time-tracking/use-time-tracking-permissions";
import { useWorkItemTime } from "@/hooks/time-tracking/use-work-item-time";
// local imports
import { WorkItemTimerButton } from "../timer/work-item-timer-button";
import { WorkItemTimeEntriesPopover } from "./time-entries-popover";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

/** The "Time" row in the work item sidebar and peek view (plan 9.4.3). */
export const WorkItemTimeProperty = observer(function WorkItemTimeProperty(props: Props) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const { canView, canLogOwn } = useTimeTrackingPermissions(workspaceSlug);
  const { openLogTimeModal } = useTimer();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();
  const { workItemTime } = useWorkItemTime(canView ? workspaceSlug : undefined, projectId, issueId);
  const [isOpen, setIsOpen] = useState(false);

  if (!canView) return null;

  const issue = getIssueById(issueId);
  // archived and draft work items can't take new time
  const canLog = canLogOwn(projectId) && !issue?.archived_at && !issue?.is_draft;
  const total = workItemTime?.total_seconds ?? 0;

  return (
    <SidebarPropertyListItem icon={Timer} label={t("time-tracking.work_item.property")}>
      <div className="flex h-7.5 w-full items-center gap-1">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <Popover.Button className="rounded-md px-2 py-0.5 text-body-xs-regular text-primary hover:bg-layer-transparent-hover">
            {total > 0 ? formatTimeDuration(total) : <span className="text-placeholder">–</span>}
          </Popover.Button>
          <Popover.Panel
            positionerClassName="z-[60]"
            side="bottom"
            align="start"
            className="z-30 rounded-md border-[0.5px] border-strong bg-surface-1 p-3 shadow-raised-200"
          >
            {workItemTime && (
              <WorkItemTimeEntriesPopover
                workspaceSlug={workspaceSlug}
                issueId={issueId}
                workItemTime={workItemTime}
                onNavigate={() => setIsOpen(false)}
              />
            )}
          </Popover.Panel>
        </Popover>
        {canLog && (
          <>
            <WorkItemTimerButton workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
            <Tooltip tooltipContent={t("time-tracking.work_item.log_time")}>
              <button
                type="button"
                aria-label={t("time-tracking.work_item.log_time")}
                onClick={() =>
                  openLogTimeModal({
                    defaults: {
                      projectId,
                      issueId,
                      issueOption: issue
                        ? {
                            id: issue.id,
                            sequence_id: issue.sequence_id,
                            name: issue.name ?? "",
                            project_identifier: getProjectIdentifierById(projectId),
                          }
                        : null,
                    },
                  })
                }
                className="flex size-6 items-center justify-center rounded-md text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
              >
                <Plus className="size-3.5" />
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </SidebarPropertyListItem>
  );
});
