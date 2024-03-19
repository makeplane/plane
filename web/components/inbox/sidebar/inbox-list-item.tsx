import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
// hooks
import { useLabel } from "hooks/store";
// icons
import { CalendarDays } from "lucide-react";
import { usePlatformOS } from "hooks/use-platform-os";
// ui
import { Tooltip, PriorityIcon } from "@plane/ui";
// components
import { InboxIssueStatus } from "components/inbox";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// store
import { IInboxIssueStore } from "store/inbox-issue.store";
// helpers
import { cn } from "helpers/common.helper";

type InboxIssueListItemProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier?: string;
  inboxIssue: IInboxIssueStore;
};

export const InboxIssueListItem: FC<InboxIssueListItemProps> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssue, projectIdentifier } = props;
  // router
  const router = useRouter();
  const { inboxIssueId } = router.query;
  // store
  const { projectLabels } = useLabel();
  const { isMobile } = usePlatformOS();
  const issue = inboxIssue.issue;

  // useEffect(() => {
  //   if (issue.id === inboxIssueId) {
  //     setTimeout(() => {
  //       const issueItemCard = document.getElementById(`inbox-issue-list-item-${issue.id}`);
  //       if (issueItemCard)
  //         issueItemCard.scrollIntoView({
  //           behavior: "smooth",
  //           block: "center",
  //         });
  //     }, 200);
  //   }
  // }, [inboxIssueId, issue.id]);

  if (!issue) return <></>;

  return (
    <>
      <Link
        id={`inbox-issue-list-item-${issue.id}`}
        key={`${projectId}_${issue.id}`}
        href={`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${issue.id}`}
      >
        <div
          className={cn(
            `flex flex-col gap-1.5 relative border-b border-custom-border-200 p-5 hover:bg-custom-primary/5 cursor-pointer`,
            { "bg-custom-primary/5 border-custom-primary-100 border": inboxIssueId === issue.id }
          )}
        >
          <div className="flex items-center justify-between text-xs">
            <p className="flex-shrink-0 text-xs font-medium text-custom-text-300">
              {projectIdentifier}-{issue.sequence_id}
            </p>
            {inboxIssue.status !== -2 && <InboxIssueStatus inboxIssue={inboxIssue} iconSize={14} />}
          </div>
          <div>
            <h3 className="text-sm truncate w-full">{issue.name}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip tooltipHeading="Priority" tooltipContent={`${issue.priority ?? "None"}`} isMobile={isMobile}>
              <PriorityIcon priority={issue.priority ?? null} className="h-3.5 w-3.5" />
            </Tooltip>
            <Tooltip
              tooltipHeading="Created on"
              tooltipContent={`${renderFormattedDate(issue.created_at ?? "")}`}
              isMobile={isMobile}
            >
              <div className="flex items-center gap-1 rounded border border-custom-border-200 px-2 py-[0.19rem] text-xs text-custom-text-200 shadow-sm">
                <CalendarDays size={12} strokeWidth={1.5} />
                <span>{renderFormattedDate(issue.created_at ?? "")}</span>
              </div>
            </Tooltip>
            {issue.priority && (
              <Tooltip tooltipHeading="Priority" tooltipContent={`${issue.priority ?? "None"}`}>
                <PriorityIcon priority={issue.priority} className="h-3.5 w-3.5" />
              </Tooltip>
            )}
            {issue.label_ids && issue.label_ids.length > 3 ? (
              <>
                <p className="text-sm px-2 py-0.5 bg-custom-background-80 rounded">{`${issue.label_ids.length} labels`}</p>
              </>
            ) : (
              <>
                {(issue.label_ids ?? []).map((labelId) => {
                  const labelDetails = projectLabels?.find((l) => l.id === labelId);

                  if (!labelDetails) return null;

                  return (
                    <div key={labelId} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: labelDetails.color,
                        }}
                      />
                      <span className="normal-case">{labelDetails.name}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </Link>
    </>
  );
});
