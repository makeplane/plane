import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
// icons
import { CalendarDays } from "lucide-react";
// ui
import { Tooltip, PriorityIcon } from "@plane/ui";
// components
import { InboxIssueStatus } from "components/inbox";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { TInboxIssue } from "@plane/types";

type InboxIssueListItemProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier: string;
  inboxIssue: TInboxIssue;
};

export const InboxIssueListItem: FC<InboxIssueListItemProps> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssue, projectIdentifier } = props;
  // router
  const router = useRouter();
  const { inboxIssueId } = router.query;

  const issue = inboxIssue.issue;

  useEffect(() => {
    if (issue.id === inboxIssueId) {
      setTimeout(() => {
        const issueItemCard = document.getElementById(`inbox-issue-list-item-${issue.id}`);
        if (issueItemCard)
          issueItemCard.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 200);
    }
  }, [inboxIssueId, issue.id]);

  return (
    <>
      <Link
        id={`inbox-issue-list-item-${issue.id}`}
        key={`${projectId}_${issue.id}`}
        href={`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${issue.id}`}
      >
        <div
          className={`relative min-h-[5rem]select-none space-y-3 border-b border-custom-border-200 px-4 py-2 hover:bg-custom-primary/5 cursor-pointer ${
            inboxIssueId === issue.id ? "bg-custom-primary/5" : " "
          } ${inboxIssue.status !== -2 ? "opacity-60" : ""}`}
        >
          <div className="flex items-center justify-between gap-x-2">
            <div className="relative flex items-center gap-x-2 overflow-hidden">
              <p className="flex-shrink-0 text-xs text-custom-text-200">
                {projectIdentifier}-{issue.sequence_id}
              </p>
              <h5 className="truncate text-sm">{issue.name}</h5>
            </div>
            <div>
              <InboxIssueStatus
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                inboxIssue={inboxIssue}
                iconSize={14}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip tooltipHeading="Priority" tooltipContent={`${issue.priority ?? "None"}`}>
              <PriorityIcon priority={issue.priority ?? null} className="h-3.5 w-3.5" />
            </Tooltip>
            <Tooltip tooltipHeading="Created on" tooltipContent={`${renderFormattedDate(issue.created_at ?? "")}`}>
              <div className="flex items-center gap-1 rounded border border-custom-border-200 px-2 py-[0.19rem] text-xs text-custom-text-200 shadow-sm">
                <CalendarDays size={12} strokeWidth={1.5} />
                <span>{renderFormattedDate(issue.created_at ?? "")}</span>
              </div>
            </Tooltip>
          </div>
        </div>
      </Link>
    </>
  );
});
