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
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-warning-text-subtle"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-warning-component-surface-light"),
    borderColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "border-yellow-500"),
  },
  {
    key: "declined",
    status: -1,
    icon: XCircle,
    title: "Declined",
    description: () => <p>This issue has been declined.</p>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-danger-text-medium"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-danger-component-surface-dark"),
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
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "text-danger-text-medium" : "text-neutral-text-medium",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "bg-danger-component-surface-dark" : "bg-primary-solid/10",
    borderColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "border-red-500" : "border-gray-500"),
  },
  {
    key: "accepted",
    status: 1,
    icon: CheckCircle2,
    title: "Accepted",
    description: () => <p>This issue has been accepted.</p>,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-success-text-medium"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-success-component-surface-dark"),
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
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-neutral-text-medium"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-primary-solid/10"),
    borderColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "border-gray-500"),
  },
];

export const INBOX_ISSUE_SOURCE = "in-app";
