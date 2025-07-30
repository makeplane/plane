"use client";

import { FC, MouseEvent } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tooltip, PriorityIcon, Row, Avatar } from "@plane/ui";
import { cn, renderFormattedDate, getFileURL } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { InboxIssueStatus } from "@/components/inbox";
// helpers
// hooks
import { useLabel, useMember, useProjectInbox } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { InboxSourcePill } from "@/plane-web/components/inbox/source-pill";

type InboxIssueListItemProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier?: string;
  inboxIssueId: string;
  setIsMobileSidebar: (value: boolean) => void;
};

export const InboxIssueListItem: FC<InboxIssueListItemProps> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssueId, projectIdentifier, setIsMobileSidebar } = props;
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
            `flex flex-col gap-2 relative border border-t-transparent border-l-transparent border-r-transparent border-b-custom-border-200 py-4 hover:bg-custom-primary/5 cursor-pointer transition-all`,
            { "border-custom-primary-100 border": selectedInboxIssueId === issue.id }
          )}
        >
          <div className="space-y-1">
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
                {projectIdentifier}-{issue.sequence_id}
              </div>
              <div className="flex items-center gap-2">
                {inboxIssue.source && <InboxSourcePill source={inboxIssue.source} />}
                {inboxIssue.status !== -2 && <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} />}
              </div>
            </div>
            <h3 className="truncate w-full text-sm">{issue.name}</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip
                tooltipHeading="Created on"
                tooltipContent={`${renderFormattedDate(issue.created_at ?? "")}`}
                isMobile={isMobile}
              >
                <div className="text-xs text-custom-text-200">{renderFormattedDate(issue.created_at ?? "")}</div>
              </Tooltip>

              <div className="border-2 rounded-full border-custom-border-400" />

              {issue.priority && (
                <Tooltip tooltipHeading="Priority" tooltipContent={`${issue.priority ?? "None"}`}>
                  <PriorityIcon priority={issue.priority} withContainer className="w-3 h-3" />
                </Tooltip>
              )}

              {issue.label_ids && issue.label_ids.length > 3 ? (
                <div className="relative !h-[17.5px] flex items-center gap-1 rounded border border-custom-border-300 px-1 text-xs">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <span className="normal-case max-w-28 truncate">{`${issue.label_ids.length} labels`}</span>
                </div>
              ) : (
                <>
                  {(issue.label_ids ?? []).map((labelId) => {
                    const labelDetails = projectLabels?.find((l) => l.id === labelId);
                    if (!labelDetails) return null;
                    return (
                      <div
                        key={labelId}
                        className="relative !h-[17.5px] flex items-center gap-1 rounded border border-custom-border-300 px-1 text-xs"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: labelDetails.color,
                          }}
                        />
                        <span className="normal-case max-w-28 truncate">{labelDetails.name}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            {/* created by */}
            {createdByDetails && createdByDetails.email?.includes("intake@plane.so") ? (
              <Avatar src={getFileURL("")} name={"Plane"} size="md" showTooltip />
            ) : createdByDetails ? (
              <ButtonAvatars showTooltip={false} userIds={createdByDetails?.id} />
            ) : null}
          </div>
        </Row>
      </Link>
    </>
  );
});
