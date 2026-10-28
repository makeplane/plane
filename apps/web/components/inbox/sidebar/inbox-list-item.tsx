/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MouseEvent } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "@plane/blocks/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Row } from "@plane/blocks/layout";
import { cn, renderFormattedDate } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { InboxIssueStatus } from "../inbox-issue-status";

type InboxIssueListItemProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier?: string;
  inboxIssueId: string;
  setIsMobileSidebar: (value: boolean) => void;
};

export const InboxIssueListItem = observer(function InboxIssueListItem(props: InboxIssueListItemProps) {
  const { workspaceSlug, projectId, inboxIssueId, projectIdentifier, setIsMobileSidebar } = props;
  // plane hooks
  const { t } = useTranslation();
  // router
  const searchParams = useSearchParams();
  const selectedInboxIssueId = searchParams.get("inboxIssueId");
  // store
  const { currentTab, getIssueInboxByIssueId } = useProjectInbox();
  const { projectLabels } = useLabel();
  const { isMobile } = usePlatformOS();
  const { getUserDetails } = useMember();
  const inboxIssue = getIssueInboxByIssueId(inboxIssueId);
  const issue = inboxIssue?.issue;

  const handleIssueRedirection = (event: MouseEvent, currentIssueId: string | undefined) => {
    if (selectedInboxIssueId === currentIssueId) event.preventDefault();
    setIsMobileSidebar(false);
  };

  if (!issue) return <></>;

  const createdByDetails = issue?.created_by ? getUserDetails(issue?.created_by) : undefined;
  const createdOn = renderFormattedDate(issue.created_at ?? "");

  return (
    <>
      <Link
        id={`inbox-issue-list-item-${issue.id}`}
        key={`${projectId}_${issue.id}`}
        href={`/${workspaceSlug}/projects/${projectId}/intake?currentTab=${currentTab}&inboxIssueId=${issue.id}`}
        onClick={(e) => handleIssueRedirection(e, issue.id)}
      >
        <Row
          className={cn(
            `relative flex cursor-pointer flex-col gap-2 border border-t-transparent border-r-transparent border-b-subtle border-l-transparent py-4 transition-all hover:bg-layer-transparent-hover`,
            { "border border-subtle bg-layer-transparent-selected": selectedInboxIssueId === issue.id }
          )}
        >
          <div className="space-y-2">
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex-shrink-0 text-caption-sm-medium text-tertiary">
                {projectIdentifier}-{issue.sequence_id}
              </div>
              <div className="flex items-center gap-2">
                {inboxIssue.status !== -2 && <InboxIssueStatus inboxIssue={inboxIssue} />}
              </div>
            </div>
            <h3 className="w-full truncate text-body-xs-regular">{issue.name}</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip label={t("common.tooltip.created_on_date", { date: createdOn ?? "" })} disabled={isMobile}>
                <div className="text-caption-sm-regular text-secondary">{createdOn}</div>
              </Tooltip>

              <div className="rounded-full border-2 border-strong-1" />

              {issue.priority && (
                <Tooltip
                  label={t("common.tooltip.priority", {
                    value: issue.priority === "none" ? t("common.none") : t(`issue.priority.${issue.priority}`),
                  })}
                >
                  <PriorityIcon priority={issue.priority} />
                </Tooltip>
              )}

              {issue.label_ids && issue.label_ids.length > 3 ? (
                <div className="relative flex !h-[17.5px] items-center gap-1 rounded-sm border border-strong px-1 text-caption-sm-regular">
                  <span className="bg-orange-400 h-2 w-2 rounded-full" />
                  <span className="max-w-28 truncate normal-case">{`${issue.label_ids.length} labels`}</span>
                </div>
              ) : (
                <>
                  {(issue.label_ids ?? []).map((labelId) => {
                    const labelDetails = projectLabels?.find((l) => l.id === labelId);
                    if (!labelDetails) return null;
                    return (
                      <div
                        key={labelId}
                        className="relative flex !h-[17.5px] items-center gap-1 rounded-sm border border-strong px-1 text-caption-sm-regular"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: labelDetails.color,
                          }}
                        />
                        <span className="max-w-28 truncate normal-case">{labelDetails.name}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            {/* created by */}
            {createdByDetails && createdByDetails.email?.includes("intake@plane.so") ? (
              <Avatar alt="Plane" fallback="P" size="xs" />
            ) : createdByDetails ? (
              <ButtonAvatars showTooltip={false} userIds={createdByDetails?.id} />
            ) : null}
          </div>
        </Row>
      </Link>
    </>
  );
});
