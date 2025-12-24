import type { FC, MouseEvent } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
// plane imports
import { PriorityIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { Row, Avatar } from "@plane/ui";
import { cn, renderFormattedDate, getFileURL } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { InboxSourcePill } from "@/plane-web/components/inbox/source-pill";
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
            `flex flex-col gap-2 relative border border-t-transparent border-l-transparent border-r-transparent border-b-subtle-1 py-4 hover:bg-accent-primary/5 cursor-pointer transition-all`,
            { "border-accent-strong border": selectedInboxIssueId === issue.id }
          )}
        >
          <div className="space-y-1">
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex-shrink-0 text-11 font-medium text-tertiary">
                {projectIdentifier}-{issue.sequence_id}
              </div>
              <div className="flex items-center gap-2">
                {inboxIssue.source && <InboxSourcePill source={inboxIssue.source} />}
                {inboxIssue.status !== -2 && <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} />}
              </div>
            </div>
            <h3 className="truncate w-full text-13">{issue.name}</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip
                tooltipHeading="Created on"
                tooltipContent={`${renderFormattedDate(issue.created_at ?? "")}`}
                isMobile={isMobile}
              >
                <div className="text-11 text-secondary">{renderFormattedDate(issue.created_at ?? "")}</div>
              </Tooltip>

              <div className="border-2 rounded-full border-strong-1" />

              {issue.priority && (
                <Tooltip tooltipHeading="Priority" tooltipContent={`${issue.priority ?? "None"}`}>
                  <PriorityIcon priority={issue.priority} withContainer className="w-3 h-3" />
                </Tooltip>
              )}

              {issue.label_ids && issue.label_ids.length > 3 ? (
                <div className="relative !h-[17.5px] flex items-center gap-1 rounded-sm border border-strong px-1 text-11">
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
                        className="relative !h-[17.5px] flex items-center gap-1 rounded-sm border border-strong px-1 text-11"
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
