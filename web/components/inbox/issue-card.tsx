import { useRouter } from "next/router";
import Link from "next/link";

// ui
import { Tooltip } from "@plane/ui";
// icons
import { PriorityIcon } from "components/icons";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import type { IInboxIssue } from "types";
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
    <Link href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}?inboxIssueId=${issue.bridge_id}`}>
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
                    ? "border-red-500/20 bg-red-500/20 text-red-500"
                    : issue.priority === "high"
                    ? "border-orange-500/20 bg-orange-500/20 text-orange-500"
                    : issue.priority === "medium"
                    ? "border-yellow-500/20 bg-yellow-500/20 text-yellow-500"
                    : issue.priority === "low"
                    ? "border-green-500/20 bg-green-500/20 text-green-500"
                    : "border-custom-border-200"
                }`}
              >
                <PriorityIcon priority={issue.priority ?? null} className="text-sm" />
              </div>
            </Tooltip>
            <Tooltip
              tooltipHeading="Created on"
              tooltipContent={`${renderShortDateWithYearFormat(issue.created_at ?? "")}`}
            >
              <div className="flex items-center gap-1 rounded border border-custom-border-200 shadow-sm text-xs px-2 py-[0.19rem] text-custom-text-200">
                <CalendarDaysIcon className="h-3.5 w-3.5" />
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
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                <span>Pending</span>
              </>
            ) : issueStatus === -1 ? (
              <>
                <XCircleIcon className="h-3.5 w-3.5" />
                <span>Declined</span>
              </>
            ) : issueStatus === 0 ? (
              <>
                <ClockIcon className="h-3.5 w-3.5" />
                <span>
                  {new Date(issue.issue_inbox[0].snoozed_till ?? "") < new Date() ? "Snoozed date passed" : "Snoozed"}
                </span>
              </>
            ) : issueStatus === 1 ? (
              <>
                <CheckCircleIcon className="h-3.5 w-3.5" />
                <span>Accepted</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                <span>Duplicate</span>
              </>
            )}
          </div>
        </div>
      </a>
    </Link>
  );
};
