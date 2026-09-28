/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CheckCircleFilledIcon, CloseCircleFilledIcon, PendingState } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { calculateTimeAgo, cn, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
// helpers
import { buildApprovalActivityEntries, type TWorkflowApprovalActivityEntry } from "@/utils/workflow-approval";

type TIssueApprovalActivityProps = {
  issueId: string;
};

const ENTRY_ICONS = {
  requested: PendingState,
  approved: CheckCircleFilledIcon,
  rejected: CloseCircleFilledIcon,
} as const;

/**
 * §21 — the approval record inside Work Item activity, next to the workflow
 * transition history.
 *
 * Plane records approvals as `WorkflowApprovalDecision` audit rows (§7.10) and
 * notifies through the existing Plane notification path (§22) rather than as
 * `IssueActivity` rows, so these entries are built from the approval read
 * endpoint instead of introducing a second feed. Same visual language as the
 * existing activity blocks, and the same component on the full detail page and
 * the peek surface, so no second comment system is added (§4).
 */
export const IssueApprovalActivity = observer(function IssueApprovalActivity(props: TIssueApprovalActivityProps) {
  const { issueId } = props;
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  // hooks
  const {
    approval: { getApprovalByIssueId },
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  // derived values
  const entries = buildApprovalActivityEntries(getApprovalByIssueId(issueId));

  if (entries.length === 0) return null;

  const renderEntryText = (entry: TWorkflowApprovalActivityEntry) => {
    const movement = entry.fromStateName && entry.toStateName ? ` (${entry.fromStateName} → ${entry.toStateName})` : "";
    if (entry.kind === "requested") return t("issue.workflow_approval.activity.requested", { movement });
    if (entry.kind === "approved") return t("issue.workflow_approval.activity.approved", { movement });
    return t("issue.workflow_approval.activity.rejected");
  };

  return (
    <div>
      {entries.map((entry, index) => {
        const Icon = ENTRY_ICONS[entry.kind];
        const actorName = entry.actorId ? (getUserDetails(entry.actorId)?.display_name ?? "") : "";
        return (
          <div
            key={entry.id}
            className={cn(
              "relative flex items-center gap-3 text-caption-sm-regular",
              index === 0 ? "pb-2" : index === entries.length - 1 ? "pt-2" : "py-2"
            )}
          >
            <div className="absolute top-0 bottom-0 left-[13px] w-px bg-layer-3" aria-hidden />
            <div className="z-[4] flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-subtle bg-layer-2 text-secondary shadow-raised-100">
              <Icon className="h-3.5 w-3.5" width={14} height={14} />
            </div>
            <div className="w-full truncate text-secondary">
              {actorName && <span className="font-medium text-primary">{actorName}</span>}
              <span> {renderEntryText(entry)}</span>
              {entry.comment && (
                <span> {t("issue.workflow_approval.activity.comment", { comment: entry.comment })}</span>
              )}
              {entry.createdAt && (
                <span>
                  <Tooltip
                    isMobile={isMobile}
                    tooltipContent={`${renderFormattedDate(entry.createdAt)}, ${renderFormattedTime(entry.createdAt)}`}
                  >
                    <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(entry.createdAt)}</span>
                  </Tooltip>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
