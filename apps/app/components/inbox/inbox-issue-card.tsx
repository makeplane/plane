import { useRouter } from "next/router";
import Link from "next/link";

// ui
import { Tooltip } from "components/ui";
// icons
import { getPriorityIcon, getStateGroupIcon } from "components/icons";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";
// helpers
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import type { IInboxIssue } from "types";

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
    <Link
      href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}?inboxIssueId=${issue.bridge_id}`}
    >
      <a>
        <Tooltip
          tooltipContent={
            issueStatus === -2
              ? "Pending issue"
              : issueStatus === -1
              ? "Declined issue"
              : issueStatus === 0
              ? "Snoozed issue"
              : issueStatus === 1
              ? "Accepted issue"
              : "Marked as duplicate"
          }
          position="right"
        >
          <div
            id={issue.id}
            className={`relative min-h-[5rem] cursor-pointer select-none space-y-3 py-2 px-4 border-b border-brand-base hover:bg-brand-accent hover:bg-opacity-10 ${
              active ? "bg-brand-accent bg-opacity-5" : " "
            } ${issue.issue_inbox[0].status !== -2 ? "opacity-60" : ""}`}
          >
            <div className="flex items-center gap-x-2">
              <p className="flex-shrink-0 text-brand-secondary text-xs">
                {issue.project_detail?.identifier}-{issue.sequence_id}
              </p>
              <h5 className="truncate text-sm">{issue.name}</h5>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip
                tooltipHeading="State"
                tooltipContent={addSpaceIfCamelCase(issue.state_detail?.name ?? "Triage")}
              >
                <div className="flex items-center gap-2 rounded border border-brand-base shadow-sm text-xs px-2 py-[0.19rem] text-brand-secondary">
                  {getStateGroupIcon(
                    issue.state_detail?.group ?? "backlog",
                    "14",
                    "14",
                    issue.state_detail?.color
                  )}
                  {issue.state_detail?.name ?? "Triage"}
                </div>
              </Tooltip>
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
                      : "border-brand-base"
                  }`}
                >
                  {getPriorityIcon(
                    issue.priority && issue.priority !== "" ? issue.priority ?? "" : "None",
                    "text-sm"
                  )}
                </div>
              </Tooltip>
              <Tooltip
                tooltipHeading="Created at"
                tooltipContent={`${renderShortNumericDateFormat(issue.created_at ?? "")}`}
              >
                <div className="flex items-center gap-1 rounded border border-brand-base shadow-sm text-xs px-2 py-[0.19rem] text-brand-secondary">
                  <CalendarDaysIcon className="h-3.5 w-3.5" />
                  <span>{renderShortNumericDateFormat(issue.created_at ?? "")}</span>
                </div>
              </Tooltip>
              {issue.issue_inbox[0].snoozed_till && (
                <div
                  className={`text-xs flex items-center gap-1 ${
                    new Date(issue.issue_inbox[0].snoozed_till ?? "") < new Date()
                      ? "text-red-500"
                      : "text-blue-500"
                  }`}
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                  <span>
                    Snoozed till {renderShortNumericDateFormat(issue.issue_inbox[0].snoozed_till)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Tooltip>
      </a>
    </Link>
  );
};
