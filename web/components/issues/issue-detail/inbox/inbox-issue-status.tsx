import React from "react";
// icons
import { AlertTriangle, CheckCircle2, Clock, Copy, ExternalLink, XCircle } from "lucide-react";
// types
import { TInboxIssueDetail } from "@plane/types";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueDetail: TInboxIssueDetail;
};

export const InboxIssueStatus: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId, inboxIssueDetail } = props;
  // derived values
  const issueStatus = inboxIssueDetail.issue_inbox.status;

  return (
    <div
      className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
        issueStatus === -2
          ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
          : issueStatus === -1
          ? "border-red-500 bg-red-500/10 text-red-500"
          : issueStatus === 0
          ? new Date(inboxIssueDetail.issue_inbox.snoozed_till ?? "") < new Date()
            ? "border-red-500 bg-red-500/10 text-red-500"
            : "border-gray-500 bg-gray-500/10 text-custom-text-200"
          : issueStatus === 1
          ? "border-green-500 bg-green-500/10 text-green-500"
          : issueStatus === 2
          ? "border-gray-500 bg-gray-500/10 text-custom-text-200"
          : ""
      }`}
    >
      {issueStatus === -2 ? (
        <>
          <AlertTriangle size={18} strokeWidth={2} />
          <p>This issue is still pending.</p>
        </>
      ) : issueStatus === -1 ? (
        <>
          <XCircle size={18} strokeWidth={2} />
          <p>This issue has been declined.</p>
        </>
      ) : issueStatus === 0 ? (
        <>
          <Clock size={18} strokeWidth={2} />
          {new Date(inboxIssueDetail.issue_inbox.snoozed_till ?? "") < new Date() ? (
            <p>This issue was snoozed till {renderFormattedDate(inboxIssueDetail.issue_inbox.snoozed_till ?? "")}.</p>
          ) : (
            <p>
              This issue has been snoozed till {renderFormattedDate(inboxIssueDetail.issue_inbox.snoozed_till ?? "")}.
            </p>
          )}
        </>
      ) : issueStatus === 1 ? (
        <>
          <CheckCircle2 size={18} strokeWidth={2} />
          <p>This issue has been accepted.</p>
        </>
      ) : issueStatus === 2 ? (
        <>
          <Copy size={18} strokeWidth={2} />
          <p className="flex items-center gap-1">
            This issue has been marked as a duplicate of
            <a
              href={`/${workspaceSlug}/projects/${projectId}/issues/${inboxIssueDetail.issue_inbox.duplicate_to}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 underline"
            >
              this issue <ExternalLink size={12} strokeWidth={2} />
            </a>
            .
          </p>
        </>
      ) : null}
    </div>
  );
};
