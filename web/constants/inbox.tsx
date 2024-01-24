// icons
import { AlertTriangle, CheckCircle2, Clock, Copy, ExternalLink, LucideIcon, XCircle } from "lucide-react";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";

export const INBOX_STATUS: {
  key: string;
  status: number;
  icon: LucideIcon;
  title: string;
  description: (workspaceSlug: string, projectId: string, issueId: string, snoozedTillDate: Date) => JSX.Element;
  textColor: (snoozeDatePassed: boolean) => string;
  bgColor: (snoozeDatePassed: boolean) => string;
  borderColor: (snoozeDatePassed: boolean) => string;
}[] = [
  {
    key: "pending",
    status: -2,
    icon: AlertTriangle,
    title: "Pending",
    description: () => <p>This issue is still pending.</p>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-yellow-500"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-yellow-500/10"),
    borderColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "border-yellow-500"),
  },
  {
    key: "declined",
    status: -1,
    icon: XCircle,
    title: "Declined",
    description: () => <p>This issue has been declined.</p>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-red-500"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-red-500/10"),
    borderColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "border-red-500"),
  },
  {
    key: "snoozed",
    status: 0,
    icon: Clock,
    title: "Snoozed",
    description: (workspaceSlug: string, projectId: string, issueId: string, snoozedTillDate: Date = new Date()) =>
      snoozedTillDate < new Date() ? (
        <p>This issue was snoozed till {renderFormattedDate(snoozedTillDate)}.</p>
      ) : (
        <p>This issue has been snoozed till {renderFormattedDate(snoozedTillDate)}.</p>
      ),
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "text-red-500" : "text-custom-text-200"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "bg-red-500/10" : "bg-gray-500/10"),
    borderColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "border-red-500" : "border-gray-500"),
  },
  {
    key: "accepted",
    status: 1,
    icon: CheckCircle2,
    title: "Accepted",
    description: () => <p>This issue has been accepted.</p>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-green-500"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-green-500/10"),
    borderColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "border-green-500"),
  },
  {
    key: "duplicate",
    status: 2,
    icon: Copy,
    title: "Duplicate",
    description: (workspaceSlug: string, projectId: string, issueId: string) => (
      <p className="flex items-center gap-1">
        This issue has been marked as a duplicate of
        <a
          href={`/${workspaceSlug}/projects/${projectId}/issues/${issueId}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 underline"
        >
          this issue <ExternalLink size={12} strokeWidth={2} />
        </a>
        .
      </p>
    ),
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-custom-text-200"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-gray-500/10"),
    borderColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "border-gray-500"),
  },
];

export const INBOX_ISSUE_SOURCE = "in-app";
