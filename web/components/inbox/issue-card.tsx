import { useRouter } from "next/router";
import Link from "next/link";

// ui
import { Tooltip, PriorityIcon } from "@plane/ui";
// icons
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IInboxIssue } from "types";
// constants
import { INBOX_STATUS } from "constants/inbox";

type Props = {
  issue: IInboxIssue;
  active: boolean;
};

export const InboxIssueCard: React.FC<Props> = (props) => {
  const { issue, active } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const issueStatus = issue.issue_inbox[0].status;

  return (
    <Link href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}?inboxIssueId=${issue.issue_inbox[0].id}`}>
      <a>
        <div
          id={issue.id}
          className={`relative min-h-[5rem] cursor-pointer select-none space-y-3 py-2 px-4 border-b border-custom-border-200 hover:bg-custom-primary/5 ${
            active ? "bg-custom-primary/5" : " "
          } ${issue.issue_inbox[0].status !== -2 ? "opacity-60" : ""}`}
        >
          <div className="flex items-center gap-x-2">
            <p className="flex-shrink-0 text-custom-text-200 text-xs">
              {issue.project_detail?.identifier}-{issue.sequence_id}
            </p>
            <h5 className="truncate text-sm">{issue.name}</h5>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip tooltipHeading="Priority" tooltipContent={`${issue.priority ?? "None"}`}>
              <div
                className={`grid h-6 w-6 place-items-center rounded border items-center shadow-sm ${
                  issue.priority === "urgent"
                    ? "border-red-500/20 bg-red-500/20"
                    : issue.priority === "high"
                    ? "border-orange-500/20 bg-orange-500/20"
                    : issue.priority === "medium"
                    ? "border-yellow-500/20 bg-yellow-500/20"
                    : issue.priority === "low"
                    ? "border-green-500/20 bg-green-500/20"
                    : "border-custom-border-200"
                }`}
              >
                <PriorityIcon priority={issue.priority ?? null} className="h-3.5 w-3.5" />
              </div>
            </Tooltip>
            <Tooltip
              tooltipHeading="Created on"
              tooltipContent={`${renderShortDateWithYearFormat(issue.created_at ?? "")}`}
            >
              <div className="flex items-center gap-1 rounded border border-custom-border-200 shadow-sm text-xs px-2 py-[0.19rem] text-custom-text-200">
                <CalendarDays size={12} strokeWidth={1.5} />
                <span>{renderShortDateWithYearFormat(issue.created_at ?? "")}</span>
              </div>
            </Tooltip>
          </div>
          <div
            className={`text-xs flex items-center justify-end gap-1 w-full ${
              issueStatus === 0 && new Date(issue.issue_inbox[0].snoozed_till ?? "") < new Date()
                ? "text-red-500"
                : INBOX_STATUS.find((s) => s.value === issueStatus)?.textColor
            }`}
          >
            {issueStatus === -2 ? (
              <>
                <AlertTriangle size={14} strokeWidth={2} />
                <span>Pending</span>
              </>
            ) : issueStatus === -1 ? (
              <>
                <XCircle size={14} strokeWidth={2} />
                <span>Declined</span>
              </>
            ) : issueStatus === 0 ? (
              <>
                <Clock size={14} strokeWidth={2} />
                <span>
                  {new Date(issue.issue_inbox[0].snoozed_till ?? "") < new Date() ? "Snoozed date passed" : "Snoozed"}
                </span>
              </>
            ) : issueStatus === 1 ? (
              <>
                <CheckCircle2 size={14} strokeWidth={2} />
                <span>Accepted</span>
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={2} />
                <span>Duplicate</span>
              </>
            )}
          </div>
        </div>
      </a>
    </Link>
  );
};
